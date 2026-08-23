// LightingTest.jsx
import React, { useRef, useEffect, useState } from 'react'
import { SVGPathData } from 'svg-pathdata'
import { DOMParser as XmldomParser } from '@xmldom/xmldom'

import { parseSvgToPathConfigs } from '@/utils/parseSvgPaths'
import type { PathConfig } from '@/utils/PathZoneObject'
import { getPathBBox } from '@/utils/utils'
import loginSider from '@/Login/LoginSider'
import {
    applyGradientLayers,
    computePathLighting,
    drawSun,
    GradientLayer,
    SunConfig,
    sunFromAngle,
} from '@/utils/Lighting/utils'

import Mountain from './oneMountainString'
import str from './test'
import treeStr from './tree'

const domParser = new XmldomParser()

const LightingTest = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [pathConfigs, setPathConfigs] = useState<any[]>([])
    const [currentSvg, setCurrentSvg] = useState<{
        x: number
        y: number
        width: number
        height: number
    }>()

    useEffect(() => {
        const configs = parseSvgToPathConfigs(Mountain)
        const doc = domParser.parseFromString(Mountain, 'image/svg+xml')
        console.log('Parsed configs:', configs)
        const darks = [...new Set(configs.filter(el => el.isDark).map(el => el.fill))]
        const lights = [...new Set(configs.filter(el => el.isLight).map(el => el.fill))]
        console.log('darks:', darks)
        console.log('lights:', lights)
        setPathConfigs(configs)
        console.log('pos:', [...new Set(configs.map(el => el.position))])
        const svgElement = doc.documentElement
        const viewBox = svgElement.getAttribute('viewBox')
        if (viewBox) {
            const [x, y, width, height] = viewBox.split(/\s+/).map(Number)
            setCurrentSvg({ x, y, width, height })
        }
        /**/
        /**/
        /**/
    }, [])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas || pathConfigs.length === 0) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Размер canvas
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight

        // Очистка
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        // ctx.fillStyle = '#1a1a2e' // тёмный фон чтобы свечение было видно
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // ✅ Конфиг солнца — все параметры в одном месте
        // Вариант 1: задаём напрямую x, y
        // Вариант 2: вычисляем из угла — раскомментировать sunFromAngle
        // angle: 0° = право, 90° = низ, 180° = лево, 270° = верх (как в тригонометрии, но Y инвертирован)
        // ✅ Угол солнца — используется и для позиции, и для определения освещённости path
        const sunAngleDeg = -45
        const sunPos = sunFromAngle(canvas.width, canvas.height, sunAngleDeg, 350)
        const sun: SunConfig = {
            x: sunPos.x, // или просто: 650
            y: sunPos.y, // или просто: 80
            intensity: 1, // сила свечения 0..1
            radius: 25, // размер круга солнца
            color: '#ffcc33', // цвет свечения
            glowRadius: 120, // радиус ореола
        }

        const startPX = 300
        const startPY = 300
        const arr = [
            // Рисуем каждый path простым цветом
            { d: 'M200,250 L400,250 L400,450 L200,450 Z', fill: '#373D52' },
        ]
        const arr2 = [
            // Рисуем каждый path простым цветом
            { d: 'M0,0 L100,0 L100,100 L0,100 L0,0', fill: '#373D52' },
        ]

        // ✅ Максимальное расстояние для нормализации (диагональ canvas)
        const maxDist = Math.sqrt(canvas.width ** 2 + canvas.height ** 2)

        // ✅ Настройка слоёв градиентов — можно включать/выключать, менять color stops
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

                    const steps = 4
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
                    // ✅ Чем меньше facing — тем сильнее затемнение (обратная сторона от солнца темнее)
                    const shadowFacing = 1 - facing // 0 = освещён (нет тени), 1 = в тени (макс тень)
                    const shadowStrength = intensity * (0.2 + shadowFacing * 0.5)
                    const dark = Math.round(255 * (1 - shadowStrength))
                    g.addColorStop(0, `rgb(${dark}, ${dark}, ${dark})`) // тень
                    g.addColorStop(0.5, `rgb(255, 255, 255)`) // нейтрально
                    g.addColorStop(1, `rgb(255, 255, 255)`) // без изменений
                },
            },
        ]

        // ✅ Рисуем все path с направленным освещением от солнца
        arr.forEach(cfg => {
            // ✅ Базовая заливка цветом path
            ctx.save()
            ctx.fillStyle = cfg.fill
            ctx.fill(new Path2D(cfg.d))
            ctx.restore()

            // ✅ Вычисляем освещение и накладываем все слои
            const lighting = computePathLighting(cfg, sun, maxDist, sunAngleDeg)
            applyGradientLayers(ctx, cfg.d, lighting, gradientLayers)
        })

        // ✅ Рисуем солнце поверх всего — чтобы было наглядно видно источник света
        drawSun(ctx, sun)
        console.log('pathConfigs', pathConfigs)
    }, [pathConfigs])

    return (
        <div style={{ width: '100vw', height: '100vh' }}>
            <div></div>
            <canvas
                ref={canvasRef}
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'block',
                }}
            />
        </div>
    )
}

export default LightingTest