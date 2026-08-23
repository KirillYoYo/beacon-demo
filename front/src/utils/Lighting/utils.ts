// ✅ Вычисляет позицию солнца по углу и расстоянию от центра canvas
// angle: 0° = право, 90° = низ, 180° = лево, 270° = верх (как в тригонометрии, но Y инвертирован)
import {applyPath2DToCanvasRenderingContext, Path2D} from 'path2d'

import {getPathBBox} from '@/utils/utils'

export function sunFromAngle(
    canvasWidth: number,
    canvasHeight: number,
    angleDeg: number,
    distance: number
): { x: number; y: number } {
    const rad = (angleDeg * Math.PI) / 180
    return {
        x: canvasWidth / 2 + Math.cos(rad) * distance,
        y: canvasHeight / 2 + Math.sin(rad) * distance,
    }
}

// ✅ Конфиг одного слоя градиента
export interface GradientLayer {
    name: string // имя слоя для отладки
    enabled: boolean // вкл/выкл слой
    compositeOperation: GlobalCompositeOperation // режим наложения: 'lighter', 'multiply' и т.д.
    direction: 'toSun' | 'fromSun' // направление градиента
    // intensity — общая яркость, facing — 0=в тени, 1=освещён
    createStops: (gradient: CanvasGradient, intensity: number, facing: number) => void
}

// ✅ Маппинг позиции path в угол (градусы, canvas: 0°=право, 90°=низ, 270°=верх)
const positionToAngle: Record<string, number> = {
    right: 0,
    'bottom-right': 45,
    bottom: 90,
    'bottom-left': 135,
    left: 180,
    'top-left': 225,
    top: 270,
    'top-right': 315,
    center: -1, // особый случай — всегда частично освещён
}

// ✅ Определяет насколько path смотрит на солнце по сетке 3×3 (0 = в тени, 1 = полностью освещён)
export function getFacingFactor(position: string | undefined, sunAngleDeg: number): number | null {
    // Если position не задан — возвращаем null, чтобы computePathLighting
    // вычислил facing из реального угла объекта к солнцу
    if (!position) return null
    if (position === 'center') return 0.5

    const posAngle = positionToAngle[position]
    if (posAngle === undefined || posAngle === -1) return 0.5

    // Разница углов (0..180°)
    let diff = Math.abs(posAngle - sunAngleDeg) % 360
    if (diff > 180) diff = 360 - diff

    // 0° разница = 1.0 (полностью освещён), 180° = 0.0 (полностью в тени)
    return 1 - diff / 180 + 0.1
}

// ✅ Вычисляет facing из реального угла объекта к солнцу (когда position не задан)
// angleToSunRad — направление от центра path к солнцу (радианы, из atan2)
function computeFacingFromAngle(angleToSunRad: number): number {
    // В canvas-координатах: отрицательный sin = солнце выше объекта
    // Солнце выше (angle ≈ -π/2) → facing ≈ 1 (освещён)
    // Солнце сбоку (angle ≈ 0 / π)   → facing ≈ 0.5
    // Солнце ниже  (angle ≈ π/2)  → facing ≈ 0 (в тени)
    return (-Math.sin(angleToSunRad) + 1) / 2
}

// ✅ Предвычисленные данные освещения для одного path
export interface PathLightingData {
    centerX: number
    centerY: number
    halfDiag: number
    angle: number // угол к солнцу
    lightIntensity: number // итоговая интенсивность
    facingFactor: number // 0 = в тени, 1 = полностью освещён
    lightEdgeX: number // освещённый край
    lightEdgeY: number
    shadowEdgeX: number // теневой край
    shadowEdgeY: number
}

// ✅ Вычисляет все параметры освещения для одного path
// worldX/worldY — мировая позиция объекта на canvas (для расчёта угла/расстояния к солнцу)
export function computePathLighting(
    cfg: {
        d: string;
        fill: string;
        isDark?: boolean;
        isLight?: boolean;
        position?: string;
        worldX?: number;
        worldY?: number
    },
    sun: SunConfig,
    maxDist: number,
    sunAngleDeg: number
): PathLightingData {
    const bbox = getPathBBox(cfg.d)
    const centerX = bbox.x + bbox.width / 2
    const centerY = bbox.y + bbox.height / 2
    const halfDiag = Math.sqrt(bbox.width ** 2 + bbox.height ** 2) * 0.5

    // Мировая позиция для расчёта угла/расстояния к солнцу
    const wx = cfg.worldX ?? centerX
    const wy = cfg.worldY ?? centerY

    // Вектор к солнцу в мировых координатах (для intensity и facing)
    const wdx = sun.x - wx
    const wdy = sun.y - wy
    const dist = Math.sqrt(wdx * wdx + wdy * wdy)
    const worldAngle = Math.atan2(wdy, wdx)

    // Локальный угол для направления градиента (от bbox центра к солнцу)
    const localAngle = worldAngle

    // Интенсивность с учётом мирового расстояния, силы солнца и типа поверхности
    const normalizedDist = Math.min(dist / maxDist, 1)
    const surfaceFactor = cfg.isDark ? 0.3 : cfg.isLight ? 1.0 : 0.6
    const lightIntensity = (1 - normalizedDist) * sun.intensity * surfaceFactor

    // Насколько path смотрит на солнце:
    // Если position задан — используем сетку 3×3, иначе — вычисляем из мирового угла к солнцу
    const gridFacing = getFacingFactor(cfg.position, sunAngleDeg)
    const facingFactor = gridFacing !== null
        ? gridFacing
        : computeFacingFromAngle(worldAngle)

    return {
        centerX,
        centerY,
        halfDiag,
        angle: localAngle,
        lightIntensity,
        facingFactor,
        lightEdgeX: centerX + Math.cos(localAngle) * halfDiag,
        lightEdgeY: centerY + Math.sin(localAngle) * halfDiag,
        shadowEdgeX: centerX - Math.cos(localAngle) * halfDiag,
        shadowEdgeY: centerY - Math.sin(localAngle) * halfDiag,
    }
}

// ✅ Применяет все включённые слои градиента к одному path
export function applyGradientLayers(
    ctx: CanvasRenderingContext2D,
    pathD: string,
    lighting: PathLightingData,
    layers: GradientLayer[]
): void {
    const path2d = new Path2D(pathD)

    layers.forEach(layer => {
        if (!layer.enabled) return // пропускаем выключенные слои

        ctx.save()
        ctx.globalCompositeOperation = layer.compositeOperation

        // ✅ Направление градиента: к солнцу или от солнца
        const [startX, startY, endX, endY] =
            layer.direction === 'toSun'
                ? [
                    lighting.lightEdgeX,
                    lighting.lightEdgeY,
                    lighting.shadowEdgeX,
                    lighting.shadowEdgeY,
                ]
                : [
                    lighting.shadowEdgeX,
                    lighting.shadowEdgeY,
                    lighting.lightEdgeX,
                    lighting.lightEdgeY,
                ]

        const gradient = ctx.createLinearGradient(startX, startY, endX, endY)
        const length = Math.sqrt(startX * startY + endX * endY)
        layer.createStops(gradient, lighting.lightIntensity, lighting.facingFactor)

        ctx.fillStyle = gradient
        ctx.fill(path2d)
        ctx.restore()
    })
}

// ✅ Создаёт стандартные градиентные слои освещения (highlight + shadow) для одного path
export function createSunGradientLayers(lighting: PathLightingData): GradientLayer[] {
    return [
        {
            name: 'highlight', // тёплый свет на солнечной стороне
            enabled: true,
            compositeOperation: 'lighter',
            direction: 'toSun',
            createStops: (g, intensity, facing) => {
                // facing < 0.4 — path не освещён, пропускаем highlight
                if (facing < 0.4) {
                    g.addColorStop(0, 'rgba(0,0,0,0)')
                    g.addColorStop(1, 'rgba(0,0,0,0)')
                    return
                }

                // Сила света масштабируется по facing
                const f = intensity * facing

                const steps = 8
                for (let i = 0; i < steps; i++) {
                    const t0 = i / steps
                    const t1 = (i + 1) / steps

                    const r = 255
                    const gCol = Math.round(240 - (240 - 220) * (i / steps))
                    const b = Math.round(200 - (200 - 150) * (i / steps))
                    const a = f * (0.7 - (0.7 - 0.15) * (i / steps))

                    const color = `rgba(${r}, ${gCol}, ${b}, ${a})`
                    g.addColorStop(t0, color)
                    g.addColorStop(t1 - 0.0001, color)
                }

                g.addColorStop(1, 'rgba(0,0,0,0)')
            },
        },
        {
            name: 'shadow', // затемнение теневой стороны
            enabled: true,
            compositeOperation: 'multiply',
            direction: 'fromSun',
            createStops: (g, intensity, facing) => {
                const shadowFacing = 1 - facing
                const shadowStrength = intensity * (0.2 + shadowFacing * 0.5)

                const steps = 8
                const end = 0.5 // затемняем только первую половину

                for (let i = 0; i < steps; i++) {
                    const t0 = (i / steps) * end
                    const t1 = ((i + 1) / steps) * end

                    // интерполяция затемнения
                    const t = i / steps
                    const dark = Math.round(255 * (1 - shadowStrength * (1 - t)))

                    const color = `rgb(${dark}, ${dark}, ${dark})`

                    g.addColorStop(t0, color)
                    g.addColorStop(t1 - 0.0001, color)
                }

                // светлая часть остаётся ровной
                g.addColorStop(0.5, `rgb(255, 255, 255)`)
                g.addColorStop(1, `rgb(255, 255, 255)`)
            },
        },
    ]
}

// ✅ Интерфейс параметров солнца
export interface SunConfig {
    x: number // позиция X на canvas (пиксели)
    y: number // позиция Y на canvas (пиксели)
    intensity: number // сила свечения 0..1 (влияет на яркость градиентов на path)
    radius: number // визуальный радиус солнца (для отрисовки)
    color: string // цвет свечения солнца
    glowRadius: number // радиус ореола вокруг солнца
}

// ✅ Рисует солнце на canvas — круг + ореол (glow)
export function drawSun(ctx: CanvasRenderingContext2D, sun: SunConfig): void {
    ctx.save()

    // ✅ Ореол — мягкий радиальный градиент вокруг солнца
    const glow = ctx.createRadialGradient(
        sun.x,
        sun.y,
        sun.radius * 0.5, // внутренний: чуть меньше самого солнца
        sun.x,
        sun.y,
        sun.glowRadius // внешний: радиус ореола
    )
    glow.addColorStop(0, `rgba(255, 200, 50, ${0.4 * sun.intensity})`) // тёплое свечение
    glow.addColorStop(0.5, `rgba(255, 150, 30, ${0.15 * sun.intensity})`)
    glow.addColorStop(1, `rgba(255, 100, 0, 0)`) // полностью прозрачный край

    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(sun.x, sun.y, sun.glowRadius, 0, Math.PI * 2)
    ctx.fill()

    // ✅ Само солнце — яркий круг
    const sunGrad = ctx.createRadialGradient(sun.x, sun.y, 0, sun.x, sun.y, sun.radius)
    sunGrad.addColorStop(0, '#fff') // белый центр
    sunGrad.addColorStop(0.6, sun.color) // основной цвет
    sunGrad.addColorStop(1, 'rgba(255,200,0,0.3)') // мягкий край

    ctx.fillStyle = sunGrad
    ctx.beginPath()
    ctx.arc(sun.x, sun.y, sun.radius, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
}