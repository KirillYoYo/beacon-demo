import { ZoneObject, ZoneObjectConfig } from './zoneCore'
import { drawSun, SunConfig } from './Lighting/utils'

/** Конфиг для создания солнечного объекта на слое */
export type SunZoneObjectConfig = Omit<ZoneObjectConfig, 'x' | 'y' | 'width' | 'height' | 'fill'> & {
    sun: SunConfig
}

/**
 * ZoneObject-обёртка для визуальной отрисовки солнца (круг + glow).
 * Добавляется в SkyLayer как обычный объект — рисуется в правильном порядке слоёв.
 * Позиция берётся из SunConfig, трансформации ZoneObject не применяются.
 */
export class SunZoneObject extends ZoneObject {
    private readonly sunConfig: SunConfig

    constructor(cfg: SunZoneObjectConfig) {
        // Базовые параметры ZoneObject берём из SunConfig
        super({
            x: cfg.sun.x,
            y: cfg.sun.y,
            z: cfg.z,
            width: cfg.sun.glowRadius * 2,
            height: cfg.sun.glowRadius * 2,
            fill: cfg.sun.color,
        })
        this.sunConfig = cfg.sun
    }

    /** Рисуем солнце напрямую — без трансформаций ZoneObject */
    override draw(ctx: CanvasRenderingContext2D): void {
        drawSun(ctx, this.sunConfig)
    }
}
