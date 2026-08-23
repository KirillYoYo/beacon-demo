import {SVGPathData} from 'svg-pathdata'

import {applyGradientLayers, computePathLighting, createSunGradientLayers, SunConfig} from '@/utils/Lighting/utils'

import {ZoneObject, ZoneObjectConfig} from './zoneCore'

export type PathZoneObjectConfig = ZoneObjectConfig & {
    d: string
    strokeWidth?: number
    /** Конфиг солнца для расчёта освещения */
    sun?: SunConfig
}

export type PathConfig = {
    d: string
    fill: string
    isDark?: boolean
    isLight?: boolean
    PathPosition?: PathPosition
    width?: number
    height?: number
    x?: number
    y?: number
    value?: string
    position?: PathPosition
}

export type PathPosition =
    | 'top-left'
    | 'top'
    | 'top-right'
    | 'left'
    | 'center'
    | 'right'
    | 'bottom-left'
    | 'bottom'
    | 'bottom-right'

type PathBounds = {
    minX: number
    minY: number
    maxX: number
    maxY: number
}

/**
 * Объект плана, который рисуется по SVG path (атрибут d).
 * Координата (x, y) задаётся в пикселях относительно origin слоя,
 * width/height — базовый размер в пикселях (масштабируется по z).
 */
export class PathZoneObject extends ZoneObject {
    private pathData: SVGPathData
    private bounds: PathBounds
    private strokeWidth?: number
    /** Конфиг солнца — используется для расчёта освещения */
    private sun?: SunConfig
    /** Исходная d-строка path для градиентов */
    private readonly d: string

    constructor(cfg: PathZoneObjectConfig) {
        super(cfg)
        this.d = cfg.d
        this.pathData = new SVGPathData(cfg.d)
        this.bounds = this.computeBounds()
        this.strokeWidth = cfg.strokeWidth
        this.sun = cfg.sun
        this.cfg = cfg
    }

    private computeBounds(): PathBounds {
        let minX = Infinity
        let minY = Infinity
        let maxX = -Infinity
        let maxY = -Infinity

        for (const cmd of this.pathData.commands) {
            // учитываем все точки команды
            const xs: number[] = []
            const ys: number[] = []

            if ('x' in cmd && typeof cmd.x === 'number') xs.push(cmd.x)
            if ('y' in cmd && typeof cmd.y === 'number') ys.push(cmd.y)
            if ('x1' in cmd && typeof cmd.x1 === 'number') xs.push(cmd.x1)
            if ('y1' in cmd && typeof cmd.y1 === 'number') ys.push(cmd.y1)
            if ('x2' in cmd && typeof cmd.x2 === 'number') xs.push(cmd.x2)
            if ('y2' in cmd && typeof cmd.y2 === 'number') ys.push(cmd.y2)

            for (const x of xs) {
                if (x < minX) minX = x
                if (x > maxX) maxX = x
            }
            for (const y of ys) {
                if (y < minY) minY = y
                if (y > maxY) maxY = y
            }
        }

        if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
            // fallback, если path пустой
            return {minX: 0, minY: 0, maxX: 1, maxY: 1}
        }

        return {minX, minY, maxX, maxY}
    }

    override draw(ctx: CanvasRenderingContext2D): void {
        const scale = this.getScale()
        const w = this.width * scale
        const h = this.height * scale

        ctx.save()
        // локальный origin слоя уже в (0, baseY), x/y — пиксели относительно origin
        ctx.translate(this.x, this.y)

        // смещаем так, чтобы anchor попал в точку (0,0)
        const offsetX = -w * this.anchorX
        const offsetY = -h * this.anchorY
        ctx.translate(offsetX, offsetY)

        // === нормализация path по реальному bbox ===
        const {minX, minY, maxX, maxY} = this.bounds
        const pathW = maxX - minX || 1
        const pathH = maxY - minY || 1

        const sx = w / pathW
        const sy = h / pathH

        // равномерный масштаб, чтобы не искажать пропорции
        const s = Math.min(sx, sy)

        // сдвигаем path так, чтобы его bbox начинался с (0,0)
        ctx.scale(s, s)
        ctx.translate(-minX, -minY)

        ctx.fillStyle = this.fill
        ctx.beginPath()

        for (const cmd of this.pathData.commands) {
            switch (cmd.type) {
                case SVGPathData.MOVE_TO:
                    ctx.moveTo(cmd.x, cmd.y)
                    break
                case SVGPathData.LINE_TO:
                    ctx.lineTo(cmd.x, cmd.y)
                    break
                case SVGPathData.CURVE_TO:
                    ctx.bezierCurveTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y)
                    break
                case SVGPathData.QUAD_TO:
                    ctx.quadraticCurveTo(cmd.x1, cmd.y1, cmd.x, cmd.y)
                    break
                case SVGPathData.CLOSE_PATH:
                    ctx.closePath()
                    break
                default:
                    break
            }
        }

        ctx.strokeStyle = '#1a1f2e' // цвет обводки
        ctx.lineWidth = this.strokeWidth || 0 // толщина
        // ctx.lineCap = 'round';        // скругленные концы
        // ctx.lineJoin = 'round';       // скругленные углы
        ctx.stroke()

        ctx.fill()

        // Если солнце задано — применяем градиенты освещения
        if (this.sun) {
            const maxDist = Math.sqrt(1200 ** 2 + 100 ** 2)
            const lighting = computePathLighting(
                {d: this.d, fill: this.fill, worldX: this.x, worldY: this.y},
                this.sun,
                maxDist,
                45
            )
            const gradientLayers = createSunGradientLayers(lighting)
            applyGradientLayers(ctx, this.d, lighting, gradientLayers)
        }

        ctx.restore()
    }
}

export type PathGroupZoneObjectConfig = ZoneObjectConfig & {
    paths: PathConfig[]
    /** Конфиг солнца для расчёта освещения path-объектов */
    sun?: SunConfig
}

/**
 * Объект плана, который состоит из нескольких SVG path'ов и рисуется как единое целое.
 */
export class PathGroupZoneObject extends ZoneObject {
    private pathDatas: SVGPathData[]
    private pathConfigs: PathConfig[]
    private bounds: PathBounds
    /** Конфиг солнца — используется для расчёта освещения */
    private sun?: SunConfig

    constructor(cfg: PathGroupZoneObjectConfig) {
        super(cfg)
        this.pathConfigs = cfg.paths
        this.pathDatas = cfg.paths.map(p => new SVGPathData(p.d).toAbs())
        this.bounds = this.computeBounds()
        this.sun = cfg.sun
    }

    private computeBounds(): PathBounds {
        let minX = Infinity
        let minY = Infinity
        let maxX = -Infinity
        let maxY = -Infinity

        for (const pathData of this.pathDatas) {
            for (const cmd of pathData.commands) {
                const xs: number[] = []
                const ys: number[] = []

                if ('x' in cmd && typeof cmd.x === 'number') xs.push(cmd.x)
                if ('y' in cmd && typeof cmd.y === 'number') ys.push(cmd.y)
                if ('x1' in cmd && typeof cmd.x1 === 'number') xs.push(cmd.x1)
                if ('y1' in cmd && typeof cmd.y1 === 'number') ys.push(cmd.y1)
                if ('x2' in cmd && typeof cmd.x2 === 'number') xs.push(cmd.x2)
                if ('y2' in cmd && typeof cmd.y2 === 'number') ys.push(cmd.y2)

                for (const x of xs) {
                    if (x < minX) minX = x
                    if (x > maxX) maxX = x
                }
                for (const y of ys) {
                    if (y < minY) minY = y
                    if (y > maxY) maxY = y
                }
            }
        }

        if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
            return {minX: 0, minY: 0, maxX: 1, maxY: 1}
        }

        return {minX, minY, maxX, maxY}
    }

    override draw(ctx: CanvasRenderingContext2D): void {
        const scale = this['getScale']()
        const w = this.width * scale
        const h = this.height * scale

        ctx.save()
        ctx.translate(this.x, this.y)

        const offsetX = -w * this.anchorX
        const offsetY = -h * this.anchorY
        ctx.translate(offsetX, offsetY)

        const {minX, minY, maxX, maxY} = this.bounds
        const pathW = maxX - minX || 1
        const pathH = maxY - minY || 1

        const sx = w / pathW
        const sy = h / pathH
        const s = Math.min(sx, sy)

        ctx.scale(s, s)
        ctx.translate(-minX, -minY)

        this.pathDatas.forEach((pathData, index) => {
            const cfg = this.pathConfigs[index]

            ctx.fillStyle = cfg.fill

            ctx.beginPath()

            for (const cmd of pathData.commands) {
                switch (cmd.type) {
                    case SVGPathData.MOVE_TO:
                        ctx.moveTo(cmd.x, cmd.y)
                        break
                    case SVGPathData.LINE_TO:
                        ctx.lineTo(cmd.x, cmd.y)
                        break
                    case SVGPathData.CURVE_TO:
                        ctx.bezierCurveTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y)
                        break
                    case SVGPathData.QUAD_TO:
                        ctx.quadraticCurveTo(cmd.x1, cmd.y1, cmd.x, cmd.y)
                        break
                    case SVGPathData.CLOSE_PATH:
                        ctx.closePath()
                        break
                }
            }

            ctx.fill()

            // Если солнце не задано — пропускаем расчёт освещения
            if (!this.sun) return
            
            const maxDist = Math.sqrt(1200 ** 2 + 100 ** 2)
            const lighting = computePathLighting(
                {...cfg, worldX: this.x, worldY: this.y},
                this.sun,
                maxDist,
                45
            )
            const gradientLayers = createSunGradientLayers(lighting)
            applyGradientLayers(ctx, cfg.d, lighting, gradientLayers)
        })

        ctx.restore()
    }
}