// LightingTest.jsx
import React, { useRef, useEffect, useState, useCallback } from 'react'

const LightingTest = () => {
    const canvasRef = useRef(null)
    const [lightAngle, setLightAngle] = useState(0) // 0=справа, 90=сверху, 180=слева

    const drawTriangleWithLighting = useCallback((ctx, lightAngle) => {
        ctx.clearRect(0, 0, 300, 200)

        // Направление света
        const lightDir = {
            x: Math.cos(((lightAngle + 90) * Math.PI) / 180),
            y: -Math.sin(((lightAngle + 90) * Math.PI) / 180),
        }

        // Треугольник: база 250px, высота 150px, центр экрана
        const points = [
            { x: 25, y: 175 }, // Левая нижняя
            { x: 275, y: 175 }, // Правая нижняя
            { x: 150, y: 25 }, // Верхняя
        ]

        ctx.save()
        ctx.beginPath()
        ctx.moveTo(points[0].x, points[0].y)
        ctx.lineTo(points[1].x, points[1].y)
        ctx.lineTo(points[2].x, points[2].y)
        ctx.closePath()

        // Вычисляем освещенность для каждой стороны
        const brightnesses = points.map((_, i) => {
            const p1 = points[i]
            const p2 = points[(i + 1) % 3]

            // Нормаль к стороне (перпендикуляр)
            const dx = p2.x - p1.x
            const dy = p2.y - p1.y
            const len = Math.sqrt(dx * dx + dy * dy)
            const normal = { x: -dy / len, y: dx / len }

            // Скалярное произведение нормали и света
            const dot = normal.x * lightDir.x + normal.y * lightDir.y
            return Math.max(0.2, (dot + 1) / 2)
        })

        // Радиальный градиент от самого освещенного угла
        const brightestIndex = brightnesses.indexOf(Math.max(...brightnesses))
        const lightCenter = points[brightestIndex]

        const gradient = ctx.createRadialGradient(
            lightCenter.x,
            lightCenter.y,
            0,
            lightCenter.x,
            lightCenter.y,
            150
        )

        // От светлого к теневому по освещенности сторон
        gradient.addColorStop(0, `rgba(255, 240, 200, ${brightnesses[brightestIndex]})`)
        gradient.addColorStop(0.3, `rgba(220, 190, 140, ${brightnesses[(brightestIndex + 1) % 3]})`)
        gradient.addColorStop(0.7, `rgba(120, 90, 60, ${Math.min(...brightnesses)})`)
        gradient.addColorStop(1, `rgba(40, 30, 20, 0.4)`)

        ctx.fillStyle = gradient
        ctx.shadowColor = 'rgba(0,0,0,0.3)'
        ctx.shadowBlur = 15
        ctx.fill()
        ctx.shadowBlur = 0
        ctx.restore()

        // Отладочная информация
        ctx.fillStyle = 'white'
        ctx.font = '14px monospace'
        ctx.fillText(`Угол солнца: ${lightAngle.toFixed(0)}°`, 10, 25)
        ctx.fillText(`Яркость сторон: [${brightnesses.map(b => b.toFixed(2)).join(', ')}]`, 10, 45)
    }, [])

    const drawRealCube = useCallback((ctx, lightAngle) => {
        ctx.clearRect(0, 0, 300, 200)

        // Направление света (из вашего рабочего треугольника)
        const lightDir = {
            x: Math.cos(((lightAngle + 90) * Math.PI) / 180),
            y: -Math.sin(((lightAngle + 90) * Math.PI) / 180),
        }

        ctx.save()
        ctx.translate(150, 100)

        // ✅ ПРАВИЛЬНЫЕ координаты ИЗОМЕТРИЧЕСКОГО КУБА
        // 8 вершин куба размером 70px
        const s = 35 // половина размера куба
        const vertices2D = [
            // Передняя грань (Z = 0)
            [-s, -s, 0], // 0
            [s, -s, 0], // 1
            [s, s, 0], // 2
            [-s, s, 0], // 3

            // Задняя грань (Z = 70)
            [-s, -s, 70], // 4
            [s, -s, 70], // 5
            [s, s, 70], // 6
            [-s, s, 70], // 7
        ].map(v => ({
            x: v[0] + v[2] * 0.5, // изометрия X
            y: v[1] + v[2] * 0.3, // изометрия Y
            z: v[2],
        }))

        // 6 граней куба с нормалями
        const faces = [
            // ПЕРЕДНЯЯ (видимая)
            { verts: [0, 1, 2, 3], normal: { x: 0, y: 0 }, zIndex: 4 },
            // ПРАВАЯ (видимая)
            { verts: [1, 2, 6, 5], normal: { x: 1, y: 0 }, zIndex: 3 },
            // ВЕРХНЯЯ (видимая)
            { verts: [0, 1, 5, 4], normal: { x: 0, y: -1 }, zIndex: 2 },
            // ЛЕВАЯ (полувидима)
            { verts: [0, 3, 7, 4], normal: { x: -1, y: 0 }, zIndex: 1 },
            // ЗАДНЯЯ (невидима)
            { verts: [3, 2, 6, 7], normal: { x: 0, y: 0 }, zIndex: 0 },
            // НИЖНЯЯ (невидима)
            { verts: [4, 5, 6, 7], normal: { x: 0, y: 1 }, zIndex: -1 },
        ]

        // Сортировка по глубине (дальние рисуем первыми)
        faces.sort((a, b) => {
            const za = a.verts.reduce((sum, i) => sum + vertices2D[i].z, 0) / 4
            const zb = b.verts.reduce((sum, i) => sum + vertices2D[i].z, 0) / 4
            return zb - za
        })

        // Рисуем грани
        faces.forEach(face => {
            if (face.zIndex < 1) return // Скрываем задние грани

            ctx.save()

            // Освещенность грани (та же логика что у треугольника!)
            const dot = face.normal.x * lightDir.x + face.normal.y * lightDir.y
            const brightness = Math.max(0.2, (dot + 1) / 2)

            // Градиент как у треугольника
            const gradient = ctx.createRadialGradient(0, 0, 0, lightDir.x * 40, lightDir.y * 40, 60)
            gradient.addColorStop(0, `rgba(255, 240, 200, ${brightness})`)
            gradient.addColorStop(0.5, `rgba(200, 180, 140, ${brightness * 0.7})`)
            gradient.addColorStop(1, `rgba(100, 90, 70, ${brightness * 0.4})`)

            ctx.fillStyle = gradient
            ctx.strokeStyle = '#333'
            ctx.lineWidth = 2
            ctx.lineJoin = 'round'
            ctx.shadowColor = 'rgba(0,0,0,0.4)'
            ctx.shadowBlur = 12

            ctx.beginPath()
            face.verts.forEach((idx, i) => {
                const v = vertices2D[idx]
                i === 0 ? ctx.moveTo(v.x, v.y) : ctx.lineTo(v.x, v.y)
            })
            ctx.closePath()
            ctx.fill()
            ctx.shadowBlur = 0
            ctx.stroke()
            ctx.restore()
        })

        ctx.restore()

        // Отладка
        ctx.fillStyle = 'white'
        ctx.font = '14px monospace'
        ctx.fillText(`Куб | Угол солнца: ${lightAngle.toFixed(0)}°`, 10, 25)
    }, [])

    useEffect(() => {
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        canvas.width = 300
        canvas.height = 200

        const render = () => drawRealCube(ctx, lightAngle)
        render()

        return () => ctx.clearRect(0, 0, 300, 200)
    }, [drawRealCube, lightAngle])

    const setPosition = angle => setLightAngle(angle)

    const animateSun = () => {
        let angle = 0
        const interval = setInterval(() => {
            setLightAngle(angle)
            angle += 2
            if (angle >= 180) {
                clearInterval(interval)
            }
        }, 50)
    }

    return (
        <div style={{ padding: '20px', fontFamily: 'monospace' }}>
            <h2>Тест освещения треугольника (300x200)</h2>

            <canvas
                ref={canvasRef}
                style={{
                    border: '2px solid #333',
                    background: '#1a1a1a',
                    cursor: 'pointer',
                }}
                onClick={() => setPosition((lightAngle + 90) % 360)}
            />

            <div style={{ marginTop: '15px' }}>
                <button onClick={() => setPosition(0)}>☀️ Справа</button>
                <button onClick={() => setPosition(90)}>☀️ Сверху</button>
                <button onClick={() => setPosition(180)}>☀️ Слева</button>
                <button onClick={animateSun}>▶️ Анимация</button>
                <button onClick={() => setPosition(45)}>↘️ 45°</button>
            </div>

            <div style={{ marginTop: '10px', fontSize: '12px', color: '#888' }}>
                Клик по canvas: следующий угол (+90°)
            </div>
        </div>
    )
}

export default LightingTest
