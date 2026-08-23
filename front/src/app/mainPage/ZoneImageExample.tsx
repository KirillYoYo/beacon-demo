'use client'

import React, { useEffect, useRef } from 'react'

export const FullScreenCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const img = new Image()
        img.src = '/api/forest' // серверная сцена из шести планов

        const draw = () => {
            if (!canvas || !ctx || !img.complete) return

            const dpr = window.devicePixelRatio || 1
            const cssWidth = window.innerWidth
            const cssHeight = window.innerHeight

            // реальный размер буфера с учётом dpr
            canvas.width = cssWidth * dpr
            canvas.height = cssHeight * dpr

            // CSS‑размер, как мы хотим отображать
            canvas.style.width = `${cssWidth}px`
            canvas.style.height = `${cssHeight}px`

            // масштабируем систему координат под dpr
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

            ctx.clearRect(0, 0, cssWidth, cssHeight)
            ctx.drawImage(img, 0, 0, cssWidth, cssHeight)
        }

        const handleResize = () => {
            draw()
        }

        img.onload = () => {
            draw()
            window.addEventListener('resize', handleResize)
        }

        return () => {
            window.removeEventListener('resize', handleResize)
        }
    }, [])

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                inset: 0,
                width: '100vw',
                height: '100vh',
                display: 'block',
            }}
        />
    )
}
