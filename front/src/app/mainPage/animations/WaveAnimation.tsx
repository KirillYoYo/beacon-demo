import React, { useEffect, useMemo, useRef, useState } from 'react'

import { PathVertexEditor } from '../../../utils/getPaths'

const BASE_PATH =
    'M0,340l10-20l20-10l10.10991-30L80,270l10-40l60-20l40-40l30,40l10,30l40,30l20,50l30,50l20-20l20,10l30-30l30,10l20-30l10-60l20-10h10l20-20l20,20l10-20l20-10l10-20l20-10l10-20h10'

const AMPLITUDE = 12
const WAVE_SPEED = 0.0025
const PHASE_SHIFT = 0.35

export const WaveAnimation: React.FC = () => {
    const editorRef = useRef<PathVertexEditor | null>(null)
    const [path, setPath] = useState<string>(BASE_PATH)
    const baseVerticesRef = useRef<Array<{ x: number; y: number; originalIndex: number }>>([])
    const rafIdRef = useRef<number | null>(null)
    const startTimeRef = useRef<number | null>(null)

    useEffect(() => {
        const editor = new PathVertexEditor(BASE_PATH)
        editorRef.current = editor

        const initialPath = editor.generatePathData()
        setPath(initialPath)

        const verticesWithIndex = editor.getVerticesWithIndex()
        baseVerticesRef.current = verticesWithIndex.map(v => ({
            x: v.x,
            y: v.y,
            originalIndex: v.index,
        }))

        startWaveAnimation()

        return () => {
            if (rafIdRef.current !== null) {
                cancelAnimationFrame(rafIdRef.current)
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const startWaveAnimation = () => {
        const editor = editorRef.current
        if (!editor || !baseVerticesRef.current.length) return

        startTimeRef.current = null

        const loop = (timestamp: number) => {
            const editorInner = editorRef.current
            const baseVertices = baseVerticesRef.current
            if (!editorInner || !baseVertices.length) return

            if (startTimeRef.current === null) {
                startTimeRef.current = timestamp
            }

            const elapsed = timestamp - startTimeRef.current
            const globalPhase = elapsed * WAVE_SPEED

            const updates = baseVertices.map((v, index) => {
                const phase = globalPhase + index * PHASE_SHIFT
                const offset = Math.sin(phase) * AMPLITUDE

                return {
                    originalIndex: v.originalIndex,
                    x: v.x,
                    y: v.y - offset,
                }
            })

            const newPath = editorInner.updatePoints(updates)
            setPath(newPath)

            rafIdRef.current = requestAnimationFrame(loop)
        }

        rafIdRef.current = requestAnimationFrame(loop)
    }

    useMemo(() => {
        if (!editorRef.current) return []
        return editorRef.current.getVertices()
    }, [path])

    return (
        <>
            <button
                style={{ padding: 30 }}
                onClick={() => {
                    const editor = editorRef.current
                    if (!editor) return

                    const resetPath = editor.reset()
                    setPath(resetPath)

                    const verticesWithIndex = editor.getVerticesWithIndex()
                    baseVerticesRef.current = verticesWithIndex.map(v => ({
                        x: v.x,
                        y: v.y,
                        originalIndex: v.index,
                    }))

                    if (rafIdRef.current !== null) {
                        cancelAnimationFrame(rafIdRef.current)
                    }
                    startWaveAnimation()
                }}
            />

            <svg
                id="e6I42g5zcZT1"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 600 600"
                shapeRendering="geometricPrecision"
                textRendering="geometricPrecision"
            >
                <path d={path} fill="none" stroke="#3f5787" strokeWidth="1.2" />
            </svg>
        </>
    )
}
