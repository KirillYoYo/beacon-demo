import React, { useEffect, useState } from 'react'

import { parseSvgToPathConfigs } from '@/utils/parseSvgPaths'
import Mountain from '@/utils/Lighting/oneMountainString'
import {
    applyGradientLayers,
    computePathLighting,
    drawSun,
    GradientLayer,
    SunConfig,
} from '@/utils/Lighting/utils'
import { PathConfig } from '@/utils/PathZoneObject'

interface propType {
    sun: SunConfig
    canvas: HTMLCanvasElement
}

const Test2 = ({ canvas, sun }: propType) => {
    const [paths, setPaths] = useState<PathConfig[]>([])

    useEffect(() => {
        const configs = parseSvgToPathConfigs(Mountain)
        setPaths(configs)
    }, [])

    useEffect(() => {
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        canvas.width = window.innerWidth
        canvas.height = window.innerHeight

        ctx.clearRect(0, 0, canvas.width, canvas.height)

        prepare(ctx, sun, paths)
    }, [canvas])

    return <div></div>
}

export default Test2

function prepare(ctx: CanvasRenderingContext2D, sun: SunConfig, arr: PathConfig[]) {
    drawSun(ctx, sun)
    //const maxDist = Math.sqrt(canvas.width ** 2 + canvas.height ** 2)
    const maxDist = 900
    drawPaths(ctx, arr, sun, maxDist)
}

const arrS = [{ d: 'M200,250 L400,250 L400,450 L200,450 Z', fill: '#373D52' }]

function drawPaths(
    ctx: CanvasRenderingContext2D,
    arr: PathConfig[],
    sun: SunConfig,
    maxDist: number
) {
    arr.forEach(cfg => {
        // ✅ Базовая заливка цветом path
        ctx.save()
        ctx.fillStyle = cfg.fill as unknown as CanvasPattern
        ctx.fill(new Path2D(cfg.d))
        ctx.restore()

        // ✅ Вычисляем освещение и накладываем все слои
        const lighting = computePathLighting(cfg, sun, maxDist, 45)
        /**/
        const gradientLayers: GradientLayer[] = [
            {
                name: 'highlight', // тёплый свет на солнечной стороне
                enabled: true,
                compositeOperation: 'lighter',
                direction: 'toSun',
                createStops: (g, intensity, facing) => {
                    // ✅ facing < 0.4 — path не освещён, пропускаем highlight
                    if (facing < 0.4) {
                        g.addColorStop(0, 'rgba(0,0,0,0)')
                        g.addColorStop(1, 'rgba(0,0,0,0)')
                        return
                    }

                    // ✅ Сила света масштабируется по facing
                    const f = intensity * facing

                    const [startX, startY, endX, endY] = [
                        lighting.lightEdgeX,
                        lighting.lightEdgeY,
                        lighting.shadowEdgeX,
                        lighting.shadowEdgeY,
                    ]
                    const length = Math.sqrt(startX * startY + endX * endY)

                    const pM = 15

                    // const steps = 8
                    const steps =
                        Math.floor((length - 350) / pM) > 1 ? Math.floor((length - 350) / pM) : 2
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
            // {
            //     name: 'shadow', // затемнение теневой стороны
            //     enabled: true,
            //     compositeOperation: 'multiply',
            //     direction: 'fromSun',
            //     createStops: (g, intensity, facing) => {
            //         const shadowFacing = 1 - facing
            //         const shadowStrength = intensity * (0.2 + shadowFacing * 0.5)
            //
            //         // const steps =
            //         //     Math.floor((length - 350) / 20) > 1 ? Math.floor((length - 350) / pM) : 2
            //         const steps = 8
            //         const end = 0.5 // затемняем только первую половину
            //
            //         for (let i = 0; i < steps; i++) {
            //             const t0 = (i / steps) * end
            //             const t1 = ((i + 1) / steps) * end
            //
            //             // интерполяция затемнения
            //             const t = i / steps
            //             const dark = Math.round(255 * (1 - shadowStrength * (1 - t)))
            //
            //             const color = `rgb(${dark}, ${dark}, ${dark})`
            //
            //             g.addColorStop(t0, color)
            //             g.addColorStop(t1 - 0.0001, color)
            //         }
            //
            //         // светлая часть остаётся ровной
            //         g.addColorStop(0.5, `rgb(255,255,255)`)
            //         g.addColorStop(1, `rgb(255,255,255)`)
            //     },
            // },
        ]
        /**/
        applyGradientLayers(ctx, cfg.d, lighting, gradientLayers)
    })
}