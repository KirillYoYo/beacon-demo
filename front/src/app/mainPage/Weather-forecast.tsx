import React from 'react'
import { Table, Tag } from 'antd'
import { ColumnsType } from 'antd/es/table'
import { WeatherForecast as ForecastType } from './types'

interface WeatherForecastProps {
    data: ForecastType[]
    loading: boolean
}

export const WeatherForecast: React.FC<WeatherForecastProps> = ({ data, loading }) => {
    const columns: ColumnsType<ForecastType> = [
        {
            title: 'Время (UTC)',
            dataIndex: 'datetime',
            key: 'datetime',
            render: val => new Date(val).toLocaleString(),
        },
        {
            title: 'Температура, °C',
            dataIndex: 'temperature',
            key: 'temperature',
            sorter: (a, b) => a.temperature - b.temperature,
        },
        {
            title: 'Ощущается как',
            dataIndex: 'feelsLike',
            key: 'feelsLike',
        },
        {
            title: 'Влажность, %',
            dataIndex: 'humidity',
            key: 'humidity',
        },
        {
            title: 'Давление, гПа',
            dataIndex: 'pressure',
            key: 'pressure',
        },
        {
            title: 'Ветер, м/с',
            dataIndex: 'windSpeed',
            key: 'windSpeed',
        },
        {
            title: 'Описание',
            dataIndex: 'description',
            key: 'description',
        },
    ]

    return (
        <Table
            key={'some-k'}
            dataSource={data}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
        />
    )
}