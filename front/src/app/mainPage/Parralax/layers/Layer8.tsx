import React, { useEffect, useRef } from 'react'

type Props = {
    offsetX: number
}

export const Layer8: React.FC<Props> = ({ offsetX }) => {
    const canvasRef = useRef(null)

    useEffect(() => {
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        canvas.width = 700
        canvas.height = 700

        const treePath = new Path2D(
            'M39.853,475.079L56.72,480.062L53.545,470.097L70.215,470.097L37.67,451.589L59.894,457.995L35.289,438.064L57.513,447.318L31.32,421.693L51.957,425.252L25.764,410.304L42.632,413.151C42.632,413.151,22.59,397.491,15.049,382.543C7.509,397.491,-12.534,413.151,-12.534,413.151L4.334,410.304L-21.859,425.252L-1.222,421.693L-27.415,447.318L-5.191,438.064L-29.796,457.995L-7.572,451.589L-40.116,470.096L-23.446,470.096L-26.621,480.061L-9.754,475.078L-34.558,495.721L-13.921,490.738L-25.827,500.703L11.135,491.692L11.135,531.311L18.965,531.311L18.965,491.692L55.927,500.703L44.021,490.738L64.658,495.721L39.853,475.079Z'
        )

        // 64 дерева из одного path
        for (let i = 0; i < 64; i++) {
            ctx.save()

            // Меньший шаг = БОЛЬШЕ наложения
            const x = (i % 10) * 60 + 20 + Math.random() * 20 // Шаг 60px + рандом
            const y = Math.floor(i / 10) * 60 + 20 + Math.random() * 20

            ctx.translate(x, y)
            ctx.scale(0.6 + Math.random() * 0.2, 0.6 + Math.random() * 0.2) // 0.6-0.8

            ctx.fillStyle = `hsl(120, 70%, ${40 + Math.random() * 20}%)` // Рандом оттенки
            ctx.fill(treePath)

            ctx.restore()
        }
    }, [])

    return (
        <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
            <canvas ref={canvasRef} width={700} height={700} style={{ display: 'block' }} />
        </div>
    )
}
