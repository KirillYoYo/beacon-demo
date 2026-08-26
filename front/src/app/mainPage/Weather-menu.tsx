import React, { useLayoutEffect, useState } from 'react'
import { Select, Slider, InputNumber, Space, Button, Row, Col } from 'antd'
import { City } from './types'

const { Option } = Select

interface WeatherMenuProps {
    cities: City[]
    selectedCityId: number | null
    onCityChange: (id: number) => void
    tempRange: [number, number]
    onTempRangeChange: (range: [number, number]) => void
    pressureRange: [number, number]
    onPressureRangeChange: (range: [number, number]) => void
    humidityRange: [number, number]
    onHumidityRangeChange: (range: [number, number]) => void
    onApply: () => void
    loading: boolean
}

export const WeatherMenu: React.FC<WeatherMenuProps> = ({
    cities,
    selectedCityId,
    onCityChange,
    tempRange,
    onTempRangeChange,
    pressureRange,
    onPressureRangeChange,
    humidityRange,
    onHumidityRangeChange,
    onApply,
    loading,
}) => {
    return (
        <div style={{ padding: '20px', background: '#f0f2f5', borderRadius: '8px' }}>
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={6}>
                    <label>Город</label>
                    <Select
                        placeholder="Выберите город"
                        style={{ width: '100%' }}
                        value={selectedCityId}
                        onChange={onCityChange}
                    >
                        {cities.map(city => (
                            <Option key={city.id} value={city.id}>
                                {city.name}, {city.country}
                            </Option>
                        ))}
                    </Select>
                </Col>

                <Col xs={24} sm={12} md={6}>
                    <label>Температура, °C</label>
                    <Slider
                        range
                        min={-30}
                        max={50}
                        value={tempRange}
                        onChange={onTempRangeChange}
                    />
                    <Space>
                        <InputNumber
                            min={-30}
                            max={50}
                            value={tempRange[0]}
                            onChange={v => onTempRangeChange([v || 0, tempRange[1]])}
                        />
                        <span>—</span>
                        <InputNumber
                            min={-30}
                            max={50}
                            value={tempRange[1]}
                            onChange={v => onTempRangeChange([tempRange[0], v || 0])}
                        />
                    </Space>
                </Col>

                <Col xs={24} sm={12} md={6}>
                    <label>Давление, гПа</label>
                    <Slider
                        range
                        min={950}
                        max={1050}
                        value={pressureRange}
                        onChange={onPressureRangeChange}
                    />
                    <Space>
                        <InputNumber
                            min={950}
                            max={1050}
                            value={pressureRange[0]}
                            onChange={v => onPressureRangeChange([v || 950, pressureRange[1]])}
                        />
                        <span>—</span>
                        <InputNumber
                            min={950}
                            max={1050}
                            value={pressureRange[1]}
                            onChange={v => onPressureRangeChange([pressureRange[0], v || 1050])}
                        />
                    </Space>
                </Col>

                <Col xs={24} sm={12} md={6}>
                    <label>Влажность, %</label>
                    <Slider
                        range
                        min={0}
                        max={100}
                        value={humidityRange}
                        onChange={onHumidityRangeChange}
                    />
                    <Space>
                        <InputNumber
                            min={0}
                            max={100}
                            value={humidityRange[0]}
                            onChange={v => onHumidityRangeChange([v || 0, humidityRange[1]])}
                        />
                        <span>—</span>
                        <InputNumber
                            min={0}
                            max={100}
                            value={humidityRange[1]}
                            onChange={v => onHumidityRangeChange([humidityRange[0], v || 100])}
                        />
                    </Space>
                </Col>
            </Row>

            <Row style={{ marginTop: 16 }}>
                <Col>
                    <Button type="primary" onClick={onApply} loading={loading}>
                        Применить фильтры
                    </Button>
                </Col>
            </Row>
        </div>
    )
}