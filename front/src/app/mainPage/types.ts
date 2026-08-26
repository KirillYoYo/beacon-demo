export interface City {
    id: number
    name: string
    country: string
    population?: number
}

export interface WeatherForecast {
    id: number
    datetime: string
    temperature: number
    feelsLike?: number
    humidity?: number
    pressure?: number
    windSpeed?: number
    windDir?: number
    description?: string
    icon?: string
}