'use client'

import React, { useCallback, useState } from 'react'

import { Layer1 } from './layers/Layer1'
import { Layer2 } from './layers/Layer2'
import { Layer8 } from './layers/Layer8'
import { Layer9 } from './layers/Layer9'
import { Layer10 } from './layers/Layer10'

const MAX_SHIFT = 30 // максимальный сдвиг ближайшего слоя по X в пикселях

export const Parralax: React.FC = () => {
    const [relativeX, setRelativeX] = useState(0)

    const handleMouseMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
        const { clientX, currentTarget } = event
        const rect = currentTarget.getBoundingClientRect()
        const x = clientX - rect.left
        const centerX = rect.width / 2

        const normalized = (x - centerX) / centerX
        const clamped = Math.max(-1, Math.min(1, normalized))
        setRelativeX(clamped)
    }, [])

    const offsets = Array.from({ length: 10 }, (_, index) => {
        const layerIndex = index + 1
        const depthFactor = (11 - layerIndex) / 10
        return relativeX * MAX_SHIFT * depthFactor
    })

    return (
        <div
            id={'parralax'}
            onMouseMove={handleMouseMove}
            style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: '100%',
                height: '100%',
                overflow: 'hidden',
            }}
        >
            <Layer10 offsetX={offsets[9]} />
            <Layer9 offsetX={offsets[8]} />
            <Layer8 offsetX={offsets[7]} />
            <Layer2 offsetX={offsets[1]} />
            <Layer1 offsetX={offsets[0]} />
        </div>
    )
}
