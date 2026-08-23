import {createCanvas} from 'canvas'

export type LayerId = 'SKY' | 'BACK_FAR' | 'BACK' | 'MID_BACK' | 'MID_FRONT' | 'FRONT'

export type ZoneObjectConfig = {
    x: number
    y: number
    z: number
    width: number
    height: number
    fill: string
    anchorX?: number
    anchorY?: number
}

export class ZoneObject {
    x: number
    y: number
    z: number
    width: number
    height: number
    fill: string
    anchorX: number
    anchorY: number

    constructor(cfg: ZoneObjectConfig) {
        this.x = cfg.x
        this.y = cfg.y
        this.z = cfg.z
        this.width = cfg.width
        this.height = cfg.height
        this.fill = cfg.fill
        this.anchorX = cfg.anchorX ?? 0.5
        this.anchorY = cfg.anchorY ?? 1.0
    }

    draw(ctx: CanvasRenderingContext2D) {
        const scale = this.getScale()
        const w = this.width * scale
        const h = this.height * scale

        ctx.save()
        ctx.translate(this.x, this.y)

        const offsetX = -w * this.anchorX
        const offsetY = -h * this.anchorY

        ctx.fillStyle = this.fill
        ctx.beginPath()
        ctx.rect(offsetX, offsetY, w, h)
        ctx.closePath()
        ctx.fill()

        ctx.restore()
    }

    protected getScale(): number {
        const minScale = 0.5
        const maxScale = 1.0
        return maxScale - (maxScale - minScale) * this.z
    }
}

export class ZoneLayer {
    id: LayerId
    color: string
    objects: ZoneObject[] = []

    constructor(id: LayerId, color: string) {
        this.id = id
        this.color = color
    }

    protected isInsideBounds(_obj: ZoneObject, _width: number, _height: number): boolean {
        return true
    }

    addObject(obj: ZoneObject, width?: number, height?: number) {
        if (width !== undefined && height !== undefined) {
            if (!this.isInsideBounds(obj, width, height)) {
                return
            }
        }
        this.objects.push(obj)
    }

    drawObjects(ctx: CanvasRenderingContext2D) {
        // Сортируем по убыванию z: дальние (z=1) рисуются первыми, ближние (z=0) — поверх
        const sorted = [...this.objects].sort((a, b) => b.z - a.z)
        for (const obj of sorted) {
            obj.draw(ctx)
        }
    }

    protected drawGround(_ctx: CanvasRenderingContext2D, _width: number, _height: number): void {
        // по умолчанию ничего
    }

    draw(ctx: CanvasRenderingContext2D, width: number, height: number): void {
        ctx.save()
        this.drawGround(ctx, width, height)
        ctx.restore()

        this.drawObjects(ctx)
    }
}

export class ZoneScene {
    layers: ZoneLayer[]

    constructor(layers: ZoneLayer[]) {
        this.layers = layers
    }

    render(ctx: CanvasRenderingContext2D, width: number, height: number) {
        for (const layer of this.layers) {
            layer.draw(ctx, width, height)
        }
    }
}

// реэкспортируем createCanvas для удобства старого кода
export {createCanvas}