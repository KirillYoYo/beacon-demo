// Grid.js
import React, { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'

import { CustomPath } from '../utils/CustomPath'
import { getEdges } from '../utils/utils'

type Point = {
    x: number
    y: number
}

const Grid = ({ rows = 30, cols = 30, cellSize = 30 }) => {
    const svgRef = useRef(null)
    const [selectedCells, setSelectedCells] = useState<{ x: number; y: number }[]>([])
    const [activeCell, setActiveCell] = useState<Point | null>(null)

    const f = selectedCells.filter((el, i) => {
        if (
            selectedCells[i - 1] &&
            selectedCells[i + 1] &&
            ((selectedCells[i - 1].x === selectedCells[i].x &&
                selectedCells[i].x === selectedCells[i + 1].x) ||
                (selectedCells[i - 1].y === selectedCells[i].y &&
                    selectedCells[i].y === selectedCells[i + 1].y))
        ) {
            return false
        }
        return true
    })

    console.log('selectedCells', selectedCells)
    console.log(
        'selectedCells x 4',
        f.map(row => {
            return {
                x: row.x * 4,
                y: row.y * 4,
            }
        })
    )

    useEffect(() => {
        const svg = d3.select(svgRef.current)
        svg.selectAll('*').remove() // очищаем перед новой отрисовкой

        const cells = []

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                cells.push({ x, y })
            }
        }

        svg.attr('width', cols * cellSize).attr('height', rows * cellSize)

        svg.selectAll('rect')
            .data(cells)
            .join('rect')
            .attr('x', d => d.x * cellSize)
            .attr('y', d => d.y * cellSize)
            .attr('width', cellSize)
            .attr('height', cellSize)
            .attr('fill', d => {
                if (f.some(c => c.x === d.x && c.y === d.y)) {
                    return 'orange'
                }
                return selectedCells.some(c => c.x === d.x && c.y === d.y) ? 'steelblue' : 'white'
            })
            .attr('stroke', d => {
                if (activeCell && d.x === activeCell.x && d.y === activeCell.y) {
                    return 'red'
                }
                return 'black'
            })
            .attr('stroke', 'black')
            .on('mouseenter', function (event, d) {
                if (event.buttons & 1) {
                    setSelectedCells(prev => {
                        return [...prev, { x: d.x, y: d.y }]
                    })
                    setActiveCell({ x: d.x, y: d.y })
                }
            })
            .on('click', function (event, d) {
                setSelectedCells(prev => {
                    const exists = prev.some(c => c.x === d.x && c.y === d.y)
                    if (exists) {
                        return prev.filter(c => !(c.x === d.x && c.y === d.y))
                    } else {
                        return [...prev, { x: d.x, y: d.y }]
                    }
                })
                setActiveCell({ x: d.x, y: d.y })
            })
    }, [rows, cols, cellSize, selectedCells, f, activeCell])

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!activeCell) return

            const moves = {
                ArrowUp: { dx: 0, dy: -1 },
                ArrowDown: { dx: 0, dy: 1 },
                ArrowLeft: { dx: -1, dy: 0 },
                ArrowRight: { dx: 1, dy: 0 },
            }

            // @ts-ignore
            const move = moves[e.key]
            if (!move) return

            const newX = activeCell.x + move.dx
            const newY = activeCell.y + move.dy

            if (newX < 0 || newY < 0 || newX >= cols || newY >= rows) return

            setActiveCell({ x: newX, y: newY })

            // Переключение закраски ячейки
            setSelectedCells(prev => {
                const exists = prev.some(c => c.x === newX && c.y === newY)
                if (exists) {
                    return prev.filter(c => !(c.x === newX && c.y === newY))
                } else {
                    return [...prev, { x: newX, y: newY }]
                }
            })
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [activeCell, cols, rows])

    return (
        <div style={{ position: 'relative' }}>
            <div
                className="some"
                style={{
                    position: 'absolute',
                    left: -300,
                    top: 0,
                    width: '400px',
                    height: '400px',
                }}
            >
                <CustomPath
                    points={selectedCells.map(el => ({
                        x: el.x * 4,
                        y: el.y * 4,
                    }))}
                    hideDotes
                    edges={getEdges(selectedCells)}
                />
            </div>
            <svg ref={svgRef}></svg>
        </div>
    )
}

export default Grid
