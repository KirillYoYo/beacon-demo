import { useEffect, useRef } from 'react'
import FingerprintJS from '@fingerprintjs/fingerprintjs'

type BeaconPayload = Record<string, any>

// URL бэкенда (порт 3000)
const BEACON_URL = 'http://localhost:3000/beacon'

export function useBeacon(additionalPayload: BeaconPayload = {}) {
    const fingerprintRef = useRef<string | null>(null)
    const isSentRef = useRef<boolean>(false)
    const pageLoadStart = useRef(Date.now())
    const clicksRef = useRef(0)

    // --- Функции сбора данных ---
    const getCanvasFingerprint = (): string => {
        try {
            const canvas = document.createElement('canvas')
            canvas.width = 200
            canvas.height = 50
            const ctx = canvas.getContext('2d')
            if (!ctx) return ''
            ctx.textBaseline = 'top'
            ctx.font = '14px Arial'
            ctx.fillStyle = '#f60'
            ctx.fillRect(125, 1, 62, 20)
            ctx.fillStyle = '#069'
            ctx.fillText('Beacon', 2, 15)
            ctx.fillStyle = 'rgba(102, 204, 0, 0.7)'
            ctx.fillText('Test', 4, 17)
            return canvas.toDataURL().slice(0, 500)
        } catch {
            return ''
        }
    }

    const collectClientData = () => {
        const conn = (navigator as any).connection || {}
        const paint = performance.getEntriesByType('paint')
        const firstPaint = paint.find(p => p.name === 'first-paint')?.startTime || 0
        const fcp = paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0

        let domReady = 0
        if (performance.timing) {
            domReady =
                performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart
        }

        return {
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            colorDepth: window.screen.colorDepth,
            timezoneOffset: -new Date().getTimezoneOffset(),
            language: navigator.language,
            platform: navigator.platform,
            deviceMemory: (navigator as any).deviceMemory || null,
            hardwareConcurrency: navigator.hardwareConcurrency || null,
            touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
            firstPaint,
            fcp,
            domReadyTime: domReady > 0 ? domReady : null,
            clicksCount: clicksRef.current,
            connectionType: conn.effectiveType || null,
            canvasFingerprint: getCanvasFingerprint(),
        }
    }

    // --- Основной эффект ---
    useEffect(() => {
        // Загрузка fingerprint
        const loadFingerprint = async () => {
            try {
                const fp = await FingerprintJS.load()
                const result = await fp.get()
                fingerprintRef.current = result.visitorId
            } catch (error) {
                console.error('Fingerprint loading error:', error)
            }
        }
        loadFingerprint()

        // Счётчик кликов
        const handleClick = () => clicksRef.current++
        window.addEventListener('click', handleClick)

        // Функция отправки
        const sendBeaconData = () => {
            if (isSentRef.current || !fingerprintRef.current) return

            const clientData = collectClientData()

            // Формируем тело запроса
            const data = {
                fingerprint: fingerprintRef.current,
                sessionId: sessionStorage.getItem('sessionId') || crypto.randomUUID(),
                url: window.location.href,
                // Все клиентские данные – на верхнем уровне
                ...clientData,
                // Дополнительные произвольные данные – в payload
                payload: {
                    ...additionalPayload,
                    clientTimestamp: new Date().toISOString(),
                    // при необходимости можно добавить ещё что-то
                },
            }

            // Отправка через sendBeacon
            const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
            let sent = false
            if (navigator.sendBeacon) {
                sent = navigator.sendBeacon(BEACON_URL, blob)
            }

            // Fallback
            if (!sent) {
                fetch(BEACON_URL, {
                    method: 'POST',
                    body: JSON.stringify(data),
                    headers: { 'Content-Type': 'application/json' },
                    keepalive: true,
                }).catch(err => {
                    console.error('Beacon fetch error:', err)
                })
            }

            isSentRef.current = true
        }

        // Подписка на события
        window.addEventListener('beforeunload', sendBeaconData)
        window.addEventListener('pagehide', sendBeaconData)

        return () => {
            window.removeEventListener('beforeunload', sendBeaconData)
            window.removeEventListener('pagehide', sendBeaconData)
            window.removeEventListener('click', handleClick)
        }
    }, [additionalPayload])
}