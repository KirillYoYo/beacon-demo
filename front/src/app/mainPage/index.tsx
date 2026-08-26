import React, { Suspense, useEffect } from 'react'

import { useQuery } from '@apollo/client'
import { GET_CITIES, GET_CITY_FORECAST } from '@/app/mainPage/weatherQueries'
import { Weather } from '@/app/mainPage/Weather'

const cityId = 1 // или из состояния/пропсов
const from = new Date().toISOString()
const to = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()

const MainPage = () => {
    // const { loading, error, data } = useQuery(GET_CITIES, {
    //     variables: { orderBy: { population: 'DESC' }, take: 1000 },
    // });

    // const { loading, error, data } = useQuery(GET_CITY_FORECAST, {
    //     variables: {
    //         cityId,   // обязательно число
    //         from,     // ISO-строка
    //         to,       // ISO-строка
    //     },
    // });

    // const { loading, error, data } = useQuery(GET_CITIES, {
    //     variables: { orderBy: { population: 'DESC' }, take: 1000 },
    // });

    const { loading, error, data } = useQuery(GET_CITY_FORECAST, {
        variables: {
            cityId, // обязательно число
            from, // ISO-строка
            to, // ISO-строка
        },
    })

    return (
        <div style={{ height: '100%' }}>
            <Weather />
        </div>
    )
}

export default MainPage