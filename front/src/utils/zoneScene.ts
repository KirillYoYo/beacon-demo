import {promises as fs} from 'fs'
import path from 'node:path'

import {createCanvas, ZoneLayer, ZoneObject, ZoneScene} from './zoneCore'
import {PathGroupZoneObject, PathConfig} from './PathZoneObject'
import {parseSvgToPathConfigs} from './parseSvgPaths'
import {sunFromAngle, SunConfig} from './Lighting/utils'
import {SunZoneObject} from './SunZoneObject'

type PopulatePathObjectsOptions = {
    maxObjects: number
    pathData: string
    sizeRange?: { min: number; max: number }
    zRange?: { min: number; max: number }
    /** Цвет для всех объектов этого вызова */
    fill: string
    strokeWidth?: number
    /** Конфиг солнца для расчёта освещения */
    sun?: SunConfig
}

const pathData =
    'M39.853,475.079L56.72,480.062L53.545,470.097L70.215,470.097L37.67,451.589L59.894,457.995L35.289,438.064L57.513,447.318L31.32,421.693L51.957,425.252L25.764,410.304L42.632,413.151C42.632,413.151,22.59,397.491,15.049,382.543C7.509,397.491,-12.534,413.151,-12.534,413.151L4.334,410.304L-21.859,425.252L-1.222,421.693L-27.415,447.318L-5.191,438.064L-29.796,457.995L-7.572,451.589L-40.116,470.096L-23.446,470.096L-26.621,480.061L-9.754,475.078L-34.558,495.721L-13.921,490.738L-25.827,500.703L11.135,491.692L11.135,531.311L18.965,531.311L18.965,491.692L55.927,500.703L44.021,490.738L64.658,495.721L39.853,475.079Z'

export function populateLayerWithPathObjects(
    layer: ZoneLayer,
    width: number,
    height: number,
    PathZoneObjectCtor: typeof import('./PathZoneObject').PathZoneObject,
    options: PopulatePathObjectsOptions
) {
    const {maxObjects, pathData, sizeRange, zRange, fill, strokeWidth, sun} = options

    const sizeMin = sizeRange?.min ?? 80
    const sizeMax = sizeRange?.max ?? 160
    const zMin = zRange?.min ?? 0.0
    const zMax = zRange?.max ?? 1.0

    // базовые уровни (как в draw)
    const yFrontBase = 0.95 * height
    const yTop = 0
    const yBottom = height

    for (let i = 0; i < maxObjects; i++) {
        const x = Math.random() * width
        let y: number
        let zoneTop: number
        let zoneBottom: number

        if (layer instanceof SkyLayer) {
            // Зона неба: между верхом экрана и кривой дальнего плана
            const backFar = new BackFarLayer()
            const lower = yTop
            const upper = backFar.getGroundYAtX(x, width, height)
            zoneTop = Math.min(lower, upper)
            zoneBottom = Math.max(lower, upper)
        } else if (layer instanceof BackFarLayer) {
            // Между кривой BackFar и кривой Back
            const backFar = new BackFarLayer()
            const back = new BackLayer()
            const lower = backFar.getGroundYAtX(x, width, height)
            const upper = back.getGroundYAtX(x, width, height)
            zoneTop = Math.min(lower, upper)
            zoneBottom = Math.max(lower, upper)
        } else if (layer instanceof BackLayer) {
            // Между кривой Back и кривой MidBack
            const back = new BackLayer()
            const midBack = new MidBackLayer()
            const lower = back.getGroundYAtX(x, width, height)
            const upper = midBack.getGroundYAtX(x, width, height)
            zoneTop = Math.min(lower, upper)
            zoneBottom = Math.max(lower, upper)
        } else if (layer instanceof MidBackLayer) {
            // Между кривой MidBack и кривой MidFront
            const midBack = new MidBackLayer()
            const midFront = new MidFrontLayer()
            const lower = midBack.getGroundYAtX(x, width, height)
            const upper = midFront.getGroundYAtX(x, width, height)
            zoneTop = Math.min(lower, upper)
            zoneBottom = Math.max(lower, upper)
        } else if (layer instanceof MidFrontLayer) {
            // Между кривой MidFront и линией начала переднего плана
            const midFront = new MidFrontLayer()
            const lower = midFront.getGroundYAtX(x, width, height)
            const upper = yFrontBase
            zoneTop = Math.min(lower, upper)
            zoneBottom = Math.max(lower, upper)
        } else if (layer instanceof FrontLayer) {
            // Передний план: локальные координаты от 0 до толщины слоя
            const layerHeight = yBottom - yFrontBase || 1
            zoneTop = 0
            zoneBottom = layerHeight
        } else {
            // fallback: весь экран
            zoneTop = yTop
            zoneBottom = yBottom
        }

        // Рандомная позиция внутри зоны
        y = zoneTop + Math.random() * (zoneBottom - zoneTop)

        // z вычисляется из y: верх зоны (zoneTop) = дальний (zMax), низ (zoneBottom) = ближний (zMin)
        const zoneHeight = zoneBottom - zoneTop || 1
        const tInZone = (y - zoneTop) / zoneHeight // 0 = верх зоны, 1 = низ
        const z = zMax - tInZone * (zMax - zMin) // верх → zMax (дальний), низ → zMin (ближний)

        // Размер объекта зависит от глубины: дальние мельче, ближние крупнее
        const baseSize = sizeMin + (sizeMax - sizeMin) * (1 - z)
        const sizeScale = 1 - z * 0.2
        const widthPx = baseSize * sizeScale
        const heightPx = baseSize * sizeScale

        layer.addObject(
            new PathZoneObjectCtor({
                x,
                y,
                z,
                width: widthPx,
                height: heightPx,
                fill,
                anchorX: 0.5,
                anchorY: 1,
                d: pathData,
                strokeWidth: strokeWidth,
                sun,
            }),
            width,
            height
        )
    }
}

// Цвета планов
const SKY_COLOR = '#1e2a78'
const BACK_FAR_COLOR = '#0b1620'
const BACK_COLOR = '#12212c'
const MID_BACK_COLOR = '#192f3b'
const MID_FRONT_COLOR = '#214252'
const FRONT_COLOR = '#2b566a'

// Небо
export class SkyLayer extends ZoneLayer {
    constructor() {
        super('SKY', SKY_COLOR)
    }

    draw(ctx: CanvasRenderingContext2D, width: number, height: number) {
        ctx.save()
        ctx.fillStyle = this.color
        ctx.fillRect(0, 0, width, height)
        ctx.restore()

        // Объекты не имеют специальной локальной системы координат, рисуем как есть
        this.drawObjects(ctx)
    }
}

// Дальний задний план
export class BackFarLayer extends ZoneLayer {
    constructor() {
        super('BACK_FAR', BACK_FAR_COLOR)
    }

    getGroundYAtX(x: number, width: number, height: number): number {
        const baseY = height * 0.55

        // Один квадратичный сегмент:
        // (0, baseY) -> (width*0.25, baseY-60) -> (width*0.5, baseY-40)
        const x0 = 0
        const y0 = baseY
        // const x1 = width * 0.25
        const y1 = baseY - 60
        const x2 = width * 0.5
        const y2 = baseY - 40

        const xClamped = Math.max(x0, Math.min(x, x2))
        const t = (xClamped - x0) / (x2 - x0 || 1)
        const oneMinusT = 1 - t
        const y = oneMinusT * oneMinusT * y0 + 2 * oneMinusT * t * y1 + t * t * y2
        return y
    }

    draw(ctx: CanvasRenderingContext2D, width: number, height: number) {
        const baseY = height * 0.55

        ctx.save()
        ctx.beginPath()
        ctx.moveTo(0, height)

        ctx.lineTo(0, baseY)
        ctx.quadraticCurveTo(width * 0.25, baseY - 60, width * 0.5, baseY - 40)
        ctx.quadraticCurveTo(width * 0.75, baseY - 20, width, baseY - 50)
        ctx.lineTo(width, height)

        ctx.closePath()
        ctx.fillStyle = this.color
        ctx.fill()
        ctx.restore()

        // Рисуем объекты поверх силуэта дальнего плана
        this.drawObjects(ctx)
    }
}

// Задний план
export class BackLayer extends ZoneLayer {
    constructor() {
        super('BACK', BACK_COLOR)
    }

    getGroundYAtX(x: number, width: number, height: number): number {
        const baseY = height * 0.65

        // Один квадратичный сегмент:
        // (0, baseY) -> (width*0.2, baseY-30) -> (width*0.45, baseY-10)
        const x0 = 0
        const y0 = baseY
        // const x1 = width * 0.2
        const y1 = baseY - 30
        const x2 = width * 0.45
        const y2 = baseY - 10

        const xClamped = Math.max(x0, Math.min(x, x2))
        const t = (xClamped - x0) / (x2 - x0 || 1)
        const oneMinusT = 1 - t
        const y = oneMinusT * oneMinusT * y0 + 2 * oneMinusT * t * y1 + t * t * y2
        return y
    }

    draw(ctx: CanvasRenderingContext2D, width: number, height: number) {
        const baseY = height * 0.65

        ctx.save()
        ctx.beginPath()
        ctx.moveTo(0, height)

        ctx.lineTo(0, baseY)
        ctx.quadraticCurveTo(width * 0.2, baseY - 30, width * 0.45, baseY - 10)
        ctx.quadraticCurveTo(width * 0.7, baseY + 10, width, baseY - 5)
        ctx.lineTo(width, height)

        ctx.closePath()
        ctx.fillStyle = this.color
        ctx.fill()
        ctx.restore()

        // Рисуем объекты заднего плана поверх его силуэта
        this.drawObjects(ctx)
    }
}

// Средний задний план
export class MidBackLayer extends ZoneLayer {
    constructor() {
        super('MID_BACK', MID_BACK_COLOR)
    }

    getGroundYAtX(x: number, width: number, height: number): number {
        const baseY = height * 0.75

        // Два квадратичных сегмента:
        // S1: (0, baseY) -> (width*0.15, baseY-10) -> (width*0.4, baseY)
        // S2: (width*0.4, baseY) -> (width*0.75, baseY+20) -> (width, baseY+5)
        const x0 = 0
        const y0 = baseY
        // const x1 = width * 0.15
        const y1 = baseY - 10
        const x2 = width * 0.4
        const y2 = baseY

        // const x3 = width * 0.75
        const y3 = baseY + 20
        const x4 = width
        const y4 = baseY + 5

        if (x <= x2) {
            const xClamped = Math.max(x0, Math.min(x, x2))
            const t = (xClamped - x0) / (x2 - x0 || 1)
            const oneMinusT = 1 - t
            return oneMinusT * oneMinusT * y0 + 2 * oneMinusT * t * y1 + t * t * y2
        } else {
            const xClamped = Math.max(x2, Math.min(x, x4))
            const t = (xClamped - x2) / (x4 - x2 || 1)
            const oneMinusT = 1 - t
            return oneMinusT * oneMinusT * y2 + 2 * oneMinusT * t * y3 + t * t * y4
        }
    }

    draw(ctx: CanvasRenderingContext2D, width: number, height: number) {
        const baseY = height * 0.75

        ctx.save()
        ctx.beginPath()
        ctx.moveTo(0, height)

        ctx.lineTo(0, baseY)
        ctx.quadraticCurveTo(width * 0.15, baseY - 10, width * 0.4, baseY)
        ctx.quadraticCurveTo(width * 0.75, baseY + 20, width, baseY + 5)
        ctx.lineTo(width, height)

        ctx.closePath()
        ctx.fillStyle = this.color
        ctx.fill()
        ctx.restore()

        // === РИСУЕМ ОБЪЕКТЫ ПЛАНА ===
        // Для простоты считаем, что локальные координаты совпадают с глобальными:
        // (0,0) — левый верх холста, поэтому никакого translate здесь не делаем.
        this.drawObjects(ctx)
    }
}

// Средний передний план
export class MidFrontLayer extends ZoneLayer {
    constructor() {
        super('MID_FRONT', MID_FRONT_COLOR)
    }

    getGroundYAtX(x: number, width: number, height: number): number {
        const baseY = height * 0.85

        // Кривая: (0, baseY) -> (width*0.3, baseY-10) -> (width*0.55, baseY+5) -> (width*0.8, baseY+20) -> (width, baseY+10)
        const x0 = 0
        const y0 = baseY
        // const x1 = width * 0.3
        const y1 = baseY - 10
        const x2 = width * 0.55
        const y2 = baseY + 5

        // const x3 = width * 0.8
        const y3 = baseY + 20
        const x4 = width
        const y4 = baseY + 10

        if (x <= x2) {
            const xClamped = Math.max(x0, Math.min(x, x2))
            const t = (xClamped - x0) / (x2 - x0 || 1)
            const oneMinusT = 1 - t
            return oneMinusT * oneMinusT * y0 + 2 * oneMinusT * t * y1 + t * t * y2
        } else {
            const xClamped = Math.max(x2, Math.min(x, x4))
            const t = (xClamped - x2) / (x4 - x2 || 1)
            const oneMinusT = 1 - t
            return oneMinusT * oneMinusT * y2 + 2 * oneMinusT * t * y3 + t * t * y4
        }
    }

    draw(ctx: CanvasRenderingContext2D, width: number, height: number) {
        const baseY = height * 0.85

        ctx.save()
        ctx.beginPath()
        ctx.moveTo(0, height)

        ctx.lineTo(0, baseY)
        ctx.quadraticCurveTo(width * 0.3, baseY - 10, width * 0.55, baseY + 5)
        ctx.quadraticCurveTo(width * 0.8, baseY + 20, width, baseY + 10)
        ctx.lineTo(width, height)

        ctx.closePath()
        ctx.fillStyle = this.color
        ctx.fill()
        ctx.restore()

        // Рисуем объекты среднего переднего плана
        this.drawObjects(ctx)
    }
}

// Передний план
export class FrontLayer extends ZoneLayer {
    constructor() {
        super('FRONT', FRONT_COLOR)
    }

    /**
     * Примитивная проверка: не даём устанавливать origin объекта за прямоугольной
     * "толщиной" плана. Объекты при отрисовке могут визуально выходить за эту
     * область (мы их не клипуем), но их точка привязки остаётся внутри слоя.
     */
    protected override isInsideBounds(obj: ZoneObject, width: number, height: number): boolean {
        const baseY = height * 0.95
        const layerHeight = height - baseY
        const x = obj.x
        const y = obj.y

        return x >= 0 && x <= width && y >= 0 && y <= layerHeight
    }

    draw(ctx: CanvasRenderingContext2D, width: number, height: number) {
        const baseY = height * 0.95
        // const layerHeight = height - baseY || 1 // высота "толщины" плана

        // 1. Рисуем фон и задаём контур плана
        ctx.save()
        ctx.beginPath()
        ctx.moveTo(0, height)
        ctx.lineTo(0, baseY)
        ctx.quadraticCurveTo(width * 0.25, baseY - 10, width * 0.5, baseY)
        ctx.quadraticCurveTo(width * 0.85, baseY + 10, width, baseY)
        ctx.lineTo(width, height)
        ctx.closePath()

        ctx.fillStyle = this.color
        ctx.fill()

        // 2. Настраиваем локальную систему координат плана:
        // (0,0) в локальных координатах — это (x=0, y=baseY) в мировых пикселях.
        // Дальше все объекты работают в пикселях относительно этого origin.
        ctx.translate(0, baseY)

        // 3. Рисуем объекты в локальных координатах (x, y) в пикселях
        this.drawObjects(ctx)

        // 4. Восстанавливаем контекст
        ctx.restore()
    }
}

// Утилита для рендера шести-плановой сцены в PNG
export async function addSvgFileAsObjectToLayer(
    layer: ZoneLayer,
    svgFilePath: string,
    options: {
        width: number
        height: number
        x: number
        y: number
        z: number
        anchorX?: number
        anchorY?: number
        defaultFill?: string
        /** Конфиг солнца для расчёта освещения */
        sun?: SunConfig
    }
) {
    const {width, height, x, y, z, anchorX = 0.5, anchorY = 1, defaultFill = '#ffffff', sun} = options

    const svgContent = await fs.readFile(svgFilePath, 'utf-8')
    const paths: PathConfig[] = parseSvgToPathConfigs(svgContent)

    if (paths.length === 0) {
        return
    }

    layer.addObject(
        new PathGroupZoneObject({
            x,
            y,
            z,
            width,
            height,
            fill: defaultFill,
            anchorX,
            anchorY,
            paths,
            sun,
        })
    )
}

/**
 * Заполняет слой сложными объектами (группой path'ов из SVG-файла),
 * используя ту же геометрию зон, что и populateLayerWithPathObjects.
 */
export async function populateLayerWithSvgObjects(
    layer: ZoneLayer,
    width: number,
    height: number,
    svgFilePath: string,
    options: {
        maxObjects: number
        sizeRange?: { min: number; max: number }
        zRange?: { min: number; max: number }
        defaultFill?: string
        /** Конфиг солнца для расчёта освещения */
        sun?: SunConfig
    }
) {
    const {maxObjects, sizeRange, zRange, defaultFill = '#ffffff', sun} = options

    const sizeMin = sizeRange?.min ?? 80
    const sizeMax = sizeRange?.max ?? 160
    const zMin = zRange?.min ?? 0.0
    const zMax = zRange?.max ?? 1.0

    // читаем SVG один раз и парсим все path/polygon
    const svgContent = await fs.readFile(svgFilePath, 'utf-8')
    const paths: PathConfig[] = parseSvgToPathConfigs(svgContent)
    if (!paths.length) {
        return
    }

    const yFrontBase = 0.95 * height
    const yTop = 0
    const yBottom = height

    for (let i = 0; i < maxObjects; i++) {
        const x = Math.random() * width
        // const x = 950
        let y: number
        let zoneTop: number
        let zoneBottom: number

        if (layer instanceof SkyLayer) {
            const backFar = new BackFarLayer()
            const lower = yTop
            const upper = backFar.getGroundYAtX(x, width, height)
            zoneTop = Math.min(lower, upper)
            zoneBottom = Math.max(lower, upper)
        } else if (layer instanceof BackFarLayer) {
            const backFar = new BackFarLayer()
            const back = new BackLayer()
            const lower = backFar.getGroundYAtX(x, width, height)
            const upper = back.getGroundYAtX(x, width, height)
            zoneTop = Math.min(lower, upper)
            zoneBottom = Math.max(lower, upper)
        } else if (layer instanceof BackLayer) {
            const back = new BackLayer()
            const midBack = new MidBackLayer()
            const lower = back.getGroundYAtX(x, width, height)
            const upper = midBack.getGroundYAtX(x, width, height)
            zoneTop = Math.min(lower, upper)
            zoneBottom = Math.max(lower, upper)
        } else if (layer instanceof MidBackLayer) {
            const midBack = new MidBackLayer()
            const midFront = new MidFrontLayer()
            const lower = midBack.getGroundYAtX(x, width, height)
            const upper = midFront.getGroundYAtX(x, width, height)
            zoneTop = Math.min(lower, upper)
            zoneBottom = Math.max(lower, upper)
        } else if (layer instanceof MidFrontLayer) {
            const midFront = new MidFrontLayer()
            const lower = midFront.getGroundYAtX(x, width, height)
            const upper = yFrontBase
            zoneTop = Math.min(lower, upper)
            zoneBottom = Math.max(lower, upper)
        } else if (layer instanceof FrontLayer) {
            const layerHeight = yBottom - yFrontBase || 1
            zoneTop = 0
            zoneBottom = layerHeight
        } else {
            zoneTop = yTop
            zoneBottom = yBottom
        }

        // Рандомная позиция внутри зоны
        y = zoneTop + Math.random() * (zoneBottom - zoneTop)

        // z вычисляется из y: верх зоны (zoneTop) = дальний (zMax), низ (zoneBottom) = ближний (zMin)
        const zoneHeight = zoneBottom - zoneTop || 1
        const tInZone = (y - zoneTop) / zoneHeight
        const z = zMax - tInZone * (zMax - zMin)

        // Размер объекта зависит от глубины: дальние мельче, ближние крупнее
        const baseSize = sizeMin + (sizeMax - sizeMin) * (1 - z)
        const sizeScale = 1 - z * 0.2
        const objWidth = baseSize * sizeScale
        const objHeight = baseSize * sizeScale

        layer.addObject(
            new PathGroupZoneObject({
                x: x,
                y: y,
                z,
                width: objWidth,
                height: objHeight,
                fill: defaultFill,
                anchorX: 0.5,
                anchorY: 1,
                paths,
                sun: {...sun, y: -250},
            }),
            width,
            height
        )
    }
}

export async function renderSixPlaneScene(width: number, height: number): Promise<Buffer> {
    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext('2d')

    // Создаём единый конфиг солнца для всей сцены
    const sunPos = sunFromAngle(width, height, -65, 350)
    const sun: SunConfig = {
        x: sunPos.x,
        y: sunPos.y,
        intensity: 1.4,
        radius: 25,
        color: '#ffcc33',
        glowRadius: 120,
    }

    const skyLayer = new SkyLayer()
    const backFarLayer = new BackFarLayer()
    const backLayer = new BackLayer()
    const midBackLayer = new MidBackLayer()
    const midFrontLayer = new MidFrontLayer()
    const frontLayer = new FrontLayer()

    // Добавляем визуальное солнце на слой неба
    skyLayer.addObject(new SunZoneObject({z: 0, sun}))

    // динамический импорт, чтобы избежать циклической зависимости между zoneScene и PathZoneObject
    const {PathZoneObject} = await import('./PathZoneObject')


    populateLayerWithPathObjects(midFrontLayer, width, height, PathZoneObject, {
        maxObjects: 100,
        pathData,
        zRange: {min: 0.0, max: 1},
        sizeRange: {min: 120, max: 140},
        fill: '#65a19b',
        strokeWidth: 2,
        sun,
    })

    populateLayerWithPathObjects(midBackLayer, width, height, PathZoneObject, {
        maxObjects: 250,
        pathData,
        zRange: {min: 0.0, max: 1},
        sizeRange: {min: 80, max: 100},
        fill: '#51817c',
        strokeWidth: 1,
        sun,
    })

    populateLayerWithPathObjects(backLayer, width, height, PathZoneObject, {
        maxObjects: 550,
        pathData,
        zRange: {min: 0.0, max: 1},
        sizeRange: {min: 60, max: 80},
        fill: '#375552',
        strokeWidth: 1,
        sun,
    })

    populateLayerWithPathObjects(backFarLayer, width, height, PathZoneObject, {
        maxObjects: 3050,
        pathData,
        zRange: {min: 0.0, max: 1},
        sizeRange: {min: 20, max: 25},
        fill: '#375552',
        strokeWidth: 1,
        sun,
    })

    // const complexPaths: PathConfig[] = [
    //     { d: 'M0,0 L50,0 L50,50 Z', fill: '#ff0000' },
    //     { d: 'M10,10 L40,10 L25,40 Z', fill: '#00ff00' },
    //     // ...
    // ]
    // backFarLayer.addObject(
    //     new PathGroupZoneObject({
    //         x: width * 0.5,
    //         y: height * 0.6, // локальные координаты FrontLayer (после translate baseY)
    //         z: 0.3,
    //         width: 200,
    //         height: 200,
    //         fill: '#ffffff', // дефолтный цвет, если у path не задан fill
    //         anchorX: 0.5,
    //         anchorY: 1,
    //         paths: complexPaths,
    //     }),
    //     width,
    //     height,
    // )

    const svgPath = path.join(process.cwd(), 'public', 'svg', 'oneMountain.svg')
    await addSvgFileAsObjectToLayer(skyLayer, svgPath, {
        width: 768,
        height: 323,
        x: width * 0.3,
        y: height * 0.6, // локальные координаты слоя
        z: 0.0,
        anchorX: 0.5,
        anchorY: 1,
        defaultFill: '#e0e1dd',
        sun,
    })

    const tree0Path = path.join(process.cwd(), 'public', 'svg', 'detail-tree.svg')
    const tree1Path = path.join(process.cwd(), 'public', 'svg', 'trees1.svg')
    const tree2Path = path.join(process.cwd(), 'public', 'svg', 'trees2.svg')
    const tree3Path = path.join(process.cwd(), 'public', 'svg', 'trees3.svg')
    const arr = [tree1Path, tree2Path, tree3Path]

    await populateLayerWithSvgObjects(frontLayer, width, height, tree0Path, {
        maxObjects: 91,
        sizeRange: {min: 200, max: 260},
        zRange: {min: 0.0, max: 1.0},
        defaultFill: '#e0e1dd',
        sun,
    })

    const scene = new ZoneScene([
        skyLayer,
        backFarLayer,
        backLayer,
        midBackLayer,
        midFrontLayer,
        frontLayer,
    ])

    //@ts-expect-error Type CanvasRenderingContext2D is missing the following properties from type CanvasRenderingContext2D:
    scene.render(ctx, width, height)

    return canvas.toBuffer('image/png')
}