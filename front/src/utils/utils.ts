import { Point } from '../Login/types'
import { SVGPathData } from 'svg-pathdata'

export const getEdges = (arr: Point[]) => {
    return arr.map((item, i) => {
        return {
            from: i as number,
            to: arr[i + 1] ? i + 1 : 0,
            type: 'straight' as const,
        }
    })
}

export function getRandomNumber(n: number, m: number): number {
    const min = Math.ceil(Math.min(n, m))
    const max = Math.floor(Math.max(n, m))
    return Math.floor(Math.random() * (max - min + 1)) + min
}

export function setToStorage<T>(key: string, value: T): void {
    try {
        const serialized = JSON.stringify(value)
        localStorage.setItem(key, serialized)
    } catch (error) {
        console.error(`Ошибка при сохранении в localStorage: ${key}`, error)
    }
}
export function getFromStorage<T>(key: string): T | null {
    try {
        const item = localStorage.getItem(key)
        return item ? (JSON.parse(item) as T) : null
    } catch (error) {
        console.error(`Ошибка при чтении из localStorage: ${key}`, error)
        return null
    }
}

export function removeFromStorage(key: string): void {
    localStorage.removeItem(key)
}

// ✅ Универсальный getPathBBox — работает и на сервере (Node.js), и в браузере
// Использует SVGPathData.getBounds() — чистая математика, без DOM
// Корректно обрабатывает все команды: M, L, C, Q, A, H, V, S, T, Z
export function getPathBBox(pathD: string): {
    x: number
    y: number
    width: number
    height: number
} {
    const fallback = { x: 0, y: 0, width: 100, height: 100 }
    if (!pathD) return fallback

    try {
        const pathData = new SVGPathData(pathD)
        const bounds = pathData.getBounds()

        const width = bounds.maxX - bounds.minX
        const height = bounds.maxY - bounds.minY

        // Защита от вырожденных path (точка или линия)
        if (width === 0 && height === 0) return fallback

        return {
            x: bounds.minX,
            y: bounds.minY,
            width: width || 1,
            height: height || 1,
        }
    } catch {
        return fallback
    }
}
