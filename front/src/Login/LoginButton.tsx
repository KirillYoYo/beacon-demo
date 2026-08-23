import React from 'react'

import ArrowAnimation from './ArrowAnimation'

import '../fonts.scss'
import AnimatedEntrance from '../utils/AnimatedEntrance'
import { CustomPath } from '../utils/CustomPath'
import { getEdges } from '../utils/utils'

import { snake, spir2 } from './arrs'

interface PropTypes {
    isHovered: boolean
    text?: string
    maskId: string
}

const width = 376
const height = 120

const LoginButton = ({ isHovered, text, maskId }: PropTypes) => {
    return (
        <svg width={width} height={height}>
            <ArrowAnimation
                width={width}
                height={height}
                flag={isHovered}
                xStart={376}
                xEnd={170}
                yStart={0}
                yEnd={0}
                colorFillArr={'rgba(200,200,0, 0.2)'}
            />
            {/*snake*/}
            <AnimatedEntrance
                flag={isHovered}
                width={width}
                height={height}
                xStart={-100}
                yStart={0}
                xEnd={0}
                yEnd={0}
            >
                <CustomPath
                    hideDotes={true}
                    justDotes={false}
                    points={snake}
                    edges={getEdges(snake)}
                    width={width}
                    height={height}
                    withoutSvg
                    colorFillArr={'rgba(200,200,0, 0.2)'}
                />
            </AnimatedEntrance>
            {/**/}
            <AnimatedEntrance
                flag={isHovered}
                width={width}
                height={height}
                xStart={70}
                yStart={-140}
                xEnd={70}
                yEnd={-20}
            >
                <CustomPath
                    hideDotes={true}
                    justDotes={false}
                    points={spir2}
                    edges={getEdges(spir2)}
                    width={width}
                    height={height}
                    withoutSvg
                    colorFillArr={'rgba(200,200,0, 0.2)'}
                />
            </AnimatedEntrance>

            <mask id={maskId}>
                <ArrowAnimation
                    width={376}
                    height={120}
                    flag={isHovered}
                    xStart={376}
                    xEnd={170}
                    yStart={0}
                    yEnd={0}
                    colorFillArr={'white'}
                />
                <AnimatedEntrance
                    flag={isHovered}
                    width={width}
                    height={height}
                    xStart={70}
                    yStart={-140}
                    xEnd={70}
                    yEnd={-20}
                >
                    <CustomPath
                        hideDotes={true}
                        justDotes={false}
                        points={spir2}
                        edges={getEdges(spir2)}
                        width={width}
                        height={height}
                        withoutSvg
                        colorFillArr={'white'}
                    />
                </AnimatedEntrance>
            </mask>
            <text
                x={'50%'}
                y={'50%'}
                fontFamily={'LoginFont'}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={24}
                fontWeight={800}
                fill="black"
            >
                {text}
            </text>
            <text
                x={'50%'}
                y={'50%'}
                fontFamily={'LoginFont'}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={24}
                fontWeight={800}
                fill="#ccc"
                mask={`url(#${maskId})`}
                pointerEvents="none"
            >
                {text}
            </text>
        </svg>
    )
}

export default LoginButton
