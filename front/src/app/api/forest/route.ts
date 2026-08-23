import { NextRequest } from 'next/server'

import { renderSixPlaneScene } from '@/utils/zoneScene'

export async function GET(_req: NextRequest) {
    const width = 1600
    const height = 900

    const buffer = await renderSixPlaneScene(width, height)

    return new Response(buffer, {
        status: 200,
        headers: {
            'Content-Type': 'image/png',
            // 'Cache-Control': 'public, max-age=3600',
        },
    })
}
