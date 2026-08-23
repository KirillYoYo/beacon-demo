import { type } from 'node:os'

import { DOMParser as XmldomParser } from '@xmldom/xmldom'
// const bounds = require('svg-path-bounds')
import bounds from 'svg-path-bounds'

import type { PathConfig, PathPosition } from './PathZoneObject'

const domParser = new XmldomParser()

// Преобразуем <polygon points="x1,y1 x2,y2 ..."> в path d="M x1,y1 L x2,y2 ... Z"
function polygonPointsToPathD(pointsAttr: string): string {
    const points = pointsAttr
        .trim()
        .split(/\s+/)
        .map(p => p.split(',').map(Number))
        .filter(([x, y]) => !Number.isNaN(x) && !Number.isNaN(y))

    if (points.length === 0) return ''

    const [firstX, firstY] = points[0]
    const commands = [`M ${firstX},${firstY}`]

    for (let i = 1; i < points.length; i++) {
        const [x, y] = points[i]
        commands.push(`L ${x},${y}`)
    }

    commands.push('Z')
    return commands.join(' ')
}

// Node-safe bbox
function getBBox(d: string) {
    const [minX, minY, maxX, maxY] = bounds(d)
    return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
        cx: (minX + maxX) / 2,
        cy: (minY + maxY) / 2,
    }
}

function getGlobalBBox(boxes: ReturnType<typeof getBBox>[]) {
    const minX = Math.min(...boxes.map(b => b.x))
    const minY = Math.min(...boxes.map(b => b.y))
    const maxX = Math.max(...boxes.map(b => b.x + b.width))
    const maxY = Math.max(...boxes.map(b => b.y + b.height))

    return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
        cx: (minX + maxX) / 2,
        cy: (minY + maxY) / 2,
    }
}

function getPosition3x3(
    box: ReturnType<typeof getBBox>,
    global: ReturnType<typeof getBBox>
): PathPosition {
    const xr = (box.cx - global.x) / global.width
    const yr = (box.cy - global.y) / global.height

    const h = xr < 0.33 ? 'left' : xr > 0.66 ? 'right' : 'center'
    const v = yr < 0.33 ? 'top' : yr > 0.66 ? 'bottom' : 'center'

    if (h === 'center' && v === 'center') return 'center'
    if (h === 'center') return v
    if (v === 'center') return h
    return `${v}-${h}`
}

// Получаем fill
function getFillFromNode(
    node: Element,
    declarations: Record<string, string>
): string | { value: string; isDark: boolean; isLight: boolean } | undefined {
    const fill = node.getAttribute('fill')
    if (fill && fill !== 'none') return fill

    const style = node.getAttribute('style')
    if (style && Object.keys(declarations).length !== 0) {
        const varMatch = style.match(/fill\s*:\s*var\((--[^)]+)\)/i)
        if (varMatch) {
            const varName = varMatch[1]
            const value = declarations[varName]
            if (value) {
                return {
                    value,
                    isDark: varName.includes('dark'),
                    isLight: varName.includes('light'),
                }
            }
        }
    }

    if (style) {
        const m = style.match(/fill\s*:\s*([^;]+)/i)
        if (m) {
            const value = m[1].trim()
            if (value && value.toLowerCase() !== 'none') return value
        }
    }
    return undefined
}

function parseDeclarationsString(declarationsStr: string): Record<string, string> {
    const variables: Record<string, string> = {}
    const cleanStr = declarationsStr.replace(/\/\/.*$/gm, '').trim()
    const lines = cleanStr.split(';').filter(line => line.trim())
    lines.forEach(line => {
        const trimmed = line.trim()
        const colonIndex = trimmed.indexOf(':')
        if (colonIndex !== -1) {
            const key = trimmed.slice(0, colonIndex).trim()
            const value = trimmed.slice(colonIndex + 1).trim()
            if (key.startsWith('--') && value) variables[key] = value
        }
    })
    return variables
}

// =================== основной парсер ===================
export function parseSvgToPathConfigs(svgSource: string): PathConfig[] {
    const doc = domParser.parseFromString(svgSource, 'image/svg+xml')
    const paths: PathConfig[] = []

    const rootMatch = svgSource.match(/:root\s*{([^}]*)}/s)
    const declarations = parseDeclarationsString(rootMatch?.[1] || '')

    // все path и polygon
    const pathNodes = Array.from(doc.getElementsByTagName('path'))
    const polyNodes = Array.from(doc.getElementsByTagName('polygon'))

    const items: { node: Element; d: string; bbox: ReturnType<typeof getBBox> }[] = []

    // path
    for (const node of pathNodes) {
        const d = node.getAttribute('d') || ''
        if (!d.trim()) continue
        items.push({ node, d, bbox: getBBox(d) })
    }

    // polygon
    for (const node of polyNodes) {
        const points = node.getAttribute('points') || ''
        const d = polygonPointsToPathD(points)
        if (!d.trim()) continue
        items.push({ node, d, bbox: getBBox(d) })
    }

    // глобальный bbox
    const globalBBox = getGlobalBBox(items.map(i => i.bbox))

    // создаём PathConfig с позицией
    for (const item of items) {
        const fill = getFillFromNode(item.node, declarations)
        const position = getPosition3x3(item.bbox, globalBBox)

        paths.push({
            d: item.d,
            // @ts-ignore
            fill: fill?.value || fill,
            // @ts-ignore
            isDark: fill?.isDark,
            // @ts-ignore
            isLight: fill?.isLight,
            position,
            width: item.bbox.width,
            height: item.bbox.height,
            x: item.bbox.x,
            y: item.bbox.y,
        })
    }

    return paths
}