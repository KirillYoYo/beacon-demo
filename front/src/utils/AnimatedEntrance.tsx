import React, { useRef, useEffect } from 'react'
import * as d3 from 'd3'

interface PropTypes {
    children: React.ReactNode
    width?: number
    height?: number
    duration?: number
    flag?: boolean | string
    withoutSvg?: boolean
    xStart?: number
    yStart?: number
    xEnd?: number
    yEnd?: number
}

const AnimatedEntrance = ({
    children,
    width = 400,
    height = 120,
    duration = 1000,
    xStart = 0,
    yStart = 0,
    flag = false,
    withoutSvg = false,
    xEnd = 50,
    yEnd = 50,
}: PropTypes) => {
    const groupRef = useRef<SVGGElement>(null)

    useEffect(() => {
        const g = d3.select(groupRef.current)

        if (!flag) {
            g.transition()
                .duration(duration)
                .ease(d3.easeCubicOut)
                .attr('transform', `translate(${xStart}, ${yStart})`)
            return
        }

        g.attr('transform', `translate(${xStart}, ${yStart})`)
            .transition()
            .duration(duration)
            .ease(d3.easeCubicOut)
            .attr('transform', `translate(${xEnd}, ${yEnd})`)
    }, [flag, width, height, duration, xEnd, yEnd])

    return withoutSvg ? (
        <React.Fragment>
            <g ref={groupRef}>{children}</g>
        </React.Fragment>
    ) : (
        <svg width={width} height={height}>
            <g ref={groupRef}>{children}</g>
        </svg>
    )
}

export default AnimatedEntrance
