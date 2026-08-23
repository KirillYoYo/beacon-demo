import React from 'react'
import { svg } from 'd3'

interface PropTypes {
    points: { x: number; y: number }[]
    edges: { from: number; to: number; type: 'straight' | 'smooth' }[]
    justDotes?: boolean
    hideDotes?: boolean
    withoutSvg?: boolean
    width?: number
    height?: number
    colorFillArr?: string
}

export function CustomPath({
    points,
    edges,
    justDotes,
    hideDotes,
    width,
    height,
    withoutSvg,
    colorFillArr,
}: PropTypes) {
    // Генерируем SVG path вручную
    const path = []

    edges.forEach(({ from, to, type }, i) => {
        const p1 = points[from]
        const p2 = points[to]

        // if (!p1.x || !p2.y || !p1.y || !p2.x) {
        //     return
        // }

        if (i === 0) {
            // Начинаем путь с первой точки
            path.push(`M${p1.x},${p1.y}`)
        }

        if (type === 'straight') {
            // Прямая линия
            path.push(`L${p2.x},${p2.y}`)
        } else if (type === 'smooth') {
            // Плавная кривая — используем квадратичную кривую
            // Управляющую точку ставим на середине между p1 и p2, с небольшим смещением вверх для эффекта "плавности"
            const cx = (p1.x + p2.x) / 2
            const cy = (p1.y + p2.y) / 2 - 30 // смещение вверх, можно настроить

            path.push(`Q${cx},${cy} ${p2.x},${p2.y}`)
        }
    })

    path.push('Z') // закрываем путь

    const wp = withoutSvg ? React.Fragment : svg
    return withoutSvg ? (
        <React.Fragment>
            {!justDotes && path && <path d={path.join(' ')} fill={colorFillArr} />}
            {!hideDotes &&
                points.map((p, i) => (
                    <g>
                        <circle key={i} cx={p.x} cy={p.y} r={2} fill="black" />
                        <text x={p.x} y={p.y - 4} fontSize={10}>
                            {i}
                        </text>
                    </g>
                ))}
        </React.Fragment>
    ) : (
        <svg width={width} height={height}>
            {!justDotes && <path d={path.join(' ')} fill={colorFillArr} />}
            {!hideDotes &&
                points.map((p, i) => (
                    <g>
                        <circle key={i} cx={p.x} cy={p.y} r={2} fill="black" />
                        <text x={p.x} y={p.y - 4} fontSize={10}>
                            {i}
                        </text>
                    </g>
                ))}
        </svg>
    )
}
