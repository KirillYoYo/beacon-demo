import React, { ReactElement, useEffect, useRef, useState } from 'react'

import { SunConfig, sunFromAngle } from '@/utils/Lighting/utils'

const CanvasWp = ({ children }: { children: ReactElement }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [sun, setSun] = useState<SunConfig | null>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        const sunAngleDeg = -45
        const bounds = canvas?.getBoundingClientRect()
        if (!bounds) return
        const sunPos: { x: number; y: number } = sunFromAngle(
            bounds.width,
            bounds.height,
            sunAngleDeg,
            350
        )
        const sun: SunConfig = {
            x: sunPos.x, // или просто: 650
            y: sunPos.y, // или просто: 80
            intensity: 1, // сила свечения 0..1
            radius: 25, // размер круга солнца
            color: '#ffcc33', // цвет свечения
            glowRadius: 120, // радиус ореола
        }
        setSun(sun)
    }, [canvasRef])

    return [
        <canvas
            ref={canvasRef}
            key={'sdsda'}
            style={{
                width: '100%',
                height: '100%',
                display: 'block',
            }}
        />,
        React.cloneElement(children, { canvas: canvasRef.current, sun, key: 'asdasd' }),
    ]
}

export default CanvasWp