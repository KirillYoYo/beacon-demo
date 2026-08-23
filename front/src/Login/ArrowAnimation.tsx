import React from 'react'

import { CustomPath } from '../utils/CustomPath'
import AnimatedEntrance from '../utils/AnimatedEntrance'

interface PropTypes {
    flag: boolean
    width?: number
    height?: number
    colorFillArr?: string
    xStart?: number
    yStart?: number
    xEnd?: number
    yEnd?: number
}

export default function ArrowAnimation({
    flag,
    width = 150,
    height = 100,
    colorFillArr,
    xStart,
    yStart,
    xEnd,
    yEnd,
}: PropTypes) {
    const gapX = 30
    const gapY = 30
    const points = [
        { x: 0 + gapX, y: 0 + gapY },
        { x: 5 + gapX, y: 20 + gapY },
        { x: 200 + gapX, y: 0 + gapY },
        { x: 200 + gapX, y: 50 + gapY },
        { x: 8 + gapX, y: 35 + gapY },
        { x: 16 + gapX, y: 53 + gapY },
        { x: 5, y: 40 + gapY },
    ]

    const edges = [
        { from: 0, to: 1, type: 'straight' as const },
        { from: 1, to: 2, type: 'smooth' as const },
        { from: 2, to: 3, type: 'straight' as const },
        { from: 3, to: 4, type: 'smooth' as const },
        { from: 4, to: 5, type: 'straight' as const },
        { from: 5, to: 6, type: 'straight' as const },
        { from: 6, to: 0, type: 'straight' as const },
    ]

    return (
        <AnimatedEntrance
            xStart={xStart}
            xEnd={xEnd}
            yStart={yStart}
            yEnd={yEnd}
            width={width}
            height={height}
            flag={flag}
            withoutSvg
        >
            <CustomPath
                hideDotes={true}
                justDotes={false}
                points={points}
                edges={edges}
                width={width}
                height={height}
                withoutSvg
                colorFillArr={colorFillArr || '#fff'}
            />
        </AnimatedEntrance>
    )
}
