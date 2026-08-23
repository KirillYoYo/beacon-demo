import React, { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'

import { Point } from './types'

const FlyingSVGPaths = ({ g }: { g: Array<React.ReactNode> }) => {
    const [positions, setPositions] = useState<Point[]>([])
    const velocitiesRef = useRef<{ dx: number; dy: number }[]>([])

    // Размеры вьюпорта храним в состоянии, чтобы не трогать window на сервере
    const [viewport, setViewport] = useState<{ width: number; height: number }>(() => ({
        width: 0,
        height: 0,
    }))

    // Один раз на клиенте читаем window.innerWidth / innerHeight и подписываемся на resize
    useEffect(() => {
        const updateViewport = () => {
            if (typeof window === 'undefined') return
            setViewport({
                width: window.innerWidth,
                height: window.innerHeight,
            })
        }

        updateViewport()
        window.addEventListener('resize', updateViewport)

        return () => {
            window.removeEventListener('resize', updateViewport)
        }
    }, [])

    const { width, height } = viewport

    // Инициализация позиций и скоростей (только когда известны реальные размеры)
    useEffect(() => {
        if (!width || !height) return

        const initialPositions = g.map(() => ({
            x: Math.random() * width,
            y: Math.random() * height,
        }))

        const velocities = g.map(() => ({
            dx: (Math.random() - 0.5) * 4,
            dy: (Math.random() - 0.5) * 4,
        }))

        setPositions(initialPositions)
        velocitiesRef.current = velocities
    }, [g, width, height])

    // D3-анимация
    useEffect(() => {
        if (positions.length === 0 || !width || !height) return

        const ticker = d3.timer(() => {
            setPositions(prev =>
                prev.map((pos, i) => {
                    let { x, y } = pos
                    let { dx, dy } = velocitiesRef.current[i]

                    x += dx
                    y += dy

                    if (x < 0 || x > width) dx *= -1
                    if (y < 0 || y > height) dy *= -1

                    velocitiesRef.current[i] = { dx, dy }
                    return { x, y }
                })
            )
        })

        return () => ticker.stop()
    }, [positions.length, width, height])

    return (
        <svg width="100%" height="100%">
            {positions.map((pos, i) => (
                <g key={i} transform={`translate(${pos.x}, ${pos.y})`}>
                    {g[i]}
                </g>
            ))}
        </svg>
    )
}

export default FlyingSVGPaths
