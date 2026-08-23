import { useState, useEffect } from 'react'

const Forest = () => {
    const [trees, setTrees] = useState([])

    useEffect(() => {
        // Генерируем паттерн один раз (несколько деревьев)
        const positions = Array.from({ length: 4 }, (_, i) => ({
            x: (i % 2) * 55,
            y: Math.floor(i / 2) * 55,
        }))
        setTrees(positions)
    }, [])

    if (!trees.length) return <div>Загрузка...</div>

    return (
        <div
            style={{
                width: '100vw',
                height: '100vh',
                margin: 0,
                padding: 0,
                overflow: 'hidden',
            }}
        >
            <svg viewBox="0 0 700 700" width="100vw" height="100vh" style={{ display: 'block' }}>
                <defs>
                    {/* ✅ Pattern с 4 деревьями (сетка 2x2) */}
                    <pattern
                        id="forest-pattern"
                        x="0"
                        y="0"
                        width="110"
                        height="110"
                        patternUnits="userSpaceOnUse"
                    >
                        {trees.map(({ x, y }, i) => (
                            <use key={`pattern-tree-${i}`} href="#tree" x={x} y={y} />
                        ))}
                    </pattern>

                    {/* Symbol дерева остается */}
                    <symbol id="tree">
                        <path
                            id="path-pnwp4e4914k"
                            d="M150.243,459.548L162.46,463.157L160.16,455.938L172.235,455.938L148.661,442.532L164.759,447.173L146.936,432.736L163.034,439.439L144.061,420.877L159.009,423.455L140.036,412.627L152.254,414.69C152.254,414.69,137.736,403.347,132.274,392.519C126.812,403.347,112.294,414.69,112.294,414.69L124.512,412.627L105.539,423.455L120.487,420.877L101.514,439.439L117.612,432.736L99.789,447.173L115.887,442.532L92.313,455.938L104.388,455.938L102.088,463.157L114.305,459.548L96.338,474.501L111.286,470.892L102.662,478.11L129.436,471.583L129.436,500.281L135.108,500.281L135.108,471.583L161.882,478.11L153.258,470.892L168.207,474.501L150.243,459.548Z"
                            fill="rgb(27,47,46)"
                            stroke="none"
                            transform="translate(-50, -450) scale(1)"
                        />
                    </symbol>
                </defs>

                {/* ✅ 1 элемент = весь лес! */}
                <rect width="700" height="700" fill="url(#forest-pattern)" />
            </svg>
        </div>
    )
}

export default Forest
