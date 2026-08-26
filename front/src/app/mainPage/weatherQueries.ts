// queries.ts
import { gql } from '@apollo/client'

// Фрагмент для базовых полей прогноза (переиспользуем)
export const FORECAST_FRAGMENT = gql`
    fragment ForecastCore on WeatherForecast {
        id
        datetime
        temperature
        feelsLike
        humidity
        pressure
        windSpeed
        windDir
        description
        icon
    }
`

// Запрос для получения всех городов (для выпадающего списка)
export const GET_CITIES = gql`
    query GetCities($orderBy: CityOrderByInput, $take: Int) {
        cities(orderBy: $orderBy, take: $take) {
            id
            name
            country
            population
        }
    }
`

// Запрос для получения прогноза города на 5 дней (с переменными)
export const GET_CITY_FORECAST = gql`
    query GetCityForecast($cityId: Int!, $from: String!, $to: String!) {
        city(id: $cityId) {
            id
            name
            country
            forecasts(
                where: { cityId: $cityId, datetimeGte: $from, datetimeLte: $to }
                orderBy: { datetime: "asc" }
            ) {
                ...ForecastCore
            }
        }
    }
    ${FORECAST_FRAGMENT}
`

// Запрос для поиска городов по названию (с частичным совпадением)
export const SEARCH_CITIES = gql`
    query SearchCities($search: String!) {
        cities(where: { nameContains: $search }, take: 10) {
            id
            name
            country
        }
    }
`

// queries.ts

export const GET_FORECASTS_FILTERED = gql`
    query GetForecastsFiltered(
        $cityId: Int!
        $from: String!
        $to: String!
        $tempMin: Float
        $tempMax: Float
        $pressureMin: Int
        $pressureMax: Int
        $humidityMin: Int
        $humidityMax: Int
    ) {
        forecasts(
            where: {
                cityId: $cityId
                datetimeGte: $from
                datetimeLte: $to
                temperatureGte: $tempMin
                temperatureLte: $tempMax
                pressureGte: $pressureMin
                pressureLte: $pressureMax
                humidityGte: $humidityMin
                humidityLte: $humidityMax
            }
            orderBy: { datetime: "asc" }
        ) {
            ...ForecastCore
        }
    }
    ${FORECAST_FRAGMENT}
`

// Запрос для текущей погоды
export const GET_CURRENT_WEATHER = gql`
    query GetCurrentWeather($cityId: Int!) {
        city(id: $cityId) {
            id
            name
            country
            forecasts(take: 1, orderBy: { datetime: "desc" }) {
                ...ForecastCore
            }
        }
    }
    ${FORECAST_FRAGMENT}
`