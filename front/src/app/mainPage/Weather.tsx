import React, { useState, useMemo, useEffect, useLayoutEffect } from 'react'
import { useQuery, useLazyQuery } from '@apollo/client'
import { GET_FORECASTS_FILTERED, GET_CITIES } from '@/app/mainPage/weatherQueries'
import { WeatherMenu } from './Weather-menu'
import { WeatherForecast } from './Weather-forecast'

export const Weather: React.FC = () => {
    // --- Состояние фильтров ---
    const [selectedCityId, setSelectedCityId] = useState<number | null>(null)
    const [tempRange, setTempRange] = useState<[number, number]>([-30, 50])
    const [pressureRange, setPressureRange] = useState<[number, number]>([950, 1050])
    const [humidityRange, setHumidityRange] = useState<[number, number]>([0, 100])
    const [dateFrom] = useState(() => new Date().toISOString())
    const [dateTo] = useState(() => {
        const d = new Date()
        d.setDate(d.getDate() + 5)
        return d.toISOString()
    })

    const [ready, setReady] = useState(false)
    useLayoutEffect(() => {
        setReady(true)
    }, [])

    // --- Запрос списка городов ---
    const {
        data: citiesData,
        loading: citiesLoading,
        error: citiesError,
    } = useQuery(GET_CITIES, {
        variables: { take: 200 },
    })

    // --- Ленивый запрос прогнозов ---
    const [getForecasts, { loading: forecastLoading, data: forecastData, error: forecastError }] =
        useLazyQuery(GET_FORECASTS_FILTERED)

    // --- Выполнение запроса при изменении фильтров ---
    const applyFilters = () => {
        if (!selectedCityId) {
            // Можно показать предупреждение
            return
        }
        getForecasts({
            variables: {
                cityId: selectedCityId,
                from: dateFrom,
                to: dateTo,
                tempMin: tempRange[0],
                tempMax: tempRange[1],
                pressureMin: pressureRange[0],
                pressureMax: pressureRange[1],
                humidityMin: humidityRange[0],
                humidityMax: humidityRange[1],
            },
        })
    }

    // Первый запрос при выборе города
    useEffect(() => {
        if (selectedCityId) {
            applyFilters()
        }
    }, [selectedCityId])

    // --- Обработчики ---
    const handleCityChange = (id: number) => setSelectedCityId(id)

    const cities = citiesData?.cities || []

    if (!ready) return <div style={{ visibility: 'hidden' }}>Loading...</div>

    return (
        <div style={{ padding: '24px' }}>
            <h1 style={{ color: '#ccc' }}>Погодный справочник</h1>

            <WeatherMenu
                cities={cities}
                selectedCityId={selectedCityId}
                onCityChange={handleCityChange}
                tempRange={tempRange}
                onTempRangeChange={setTempRange}
                pressureRange={pressureRange}
                onPressureRangeChange={setPressureRange}
                humidityRange={humidityRange}
                onHumidityRangeChange={setHumidityRange}
                onApply={applyFilters}
                loading={forecastLoading}
            />

            {citiesLoading && <div>Загрузка списка городов...</div>}
            {citiesError && <div>Ошибка загрузки городов: {citiesError.message}</div>}

            <hr style={{ margin: '24px 0' }} />

            {forecastError ? (
                <div>Ошибка получения прогнозов: {forecastError.message}</div>
            ) : (
                <WeatherForecast data={forecastData?.forecasts || []} loading={forecastLoading} />
            )}
        </div>
    )
}