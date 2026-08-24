import { Controller, Get, Post, Query, Param } from '@nestjs/common';
import { WeatherService } from './weather.service';
import { WeatherImportService } from './weather-import.service';

@Controller('weather')
export class WeatherController {
  constructor(
    private weatherService: WeatherService,
    private importService: WeatherImportService,
  ) {}

  // Ручной запуск обновления (например, через админку)
  @Post('refresh')
  async refresh() {
    await this.weatherService.refreshAllForecasts();
    return { message: 'Обновление запущено' };
  }

  // Импорт городов (запустить один раз)
  // todo добавить seed функцию сюда
  // @Post('import-cities')
  // async importCities() {
  //     return this.importService.importCities();
  // }

  // Получить прогноз для города по ID
  @Get('forecast/:cityId')
  async getForecast(
    @Param('cityId') cityId: string,
    @Query('days') days: number = 7,
  ) {
    return this.weatherService.getForecast(+cityId, days);
  }

  // Получить прогноз по координатам
  @Get('forecast')
  async getForecastByCoords(
    @Query('lat') lat: string,
    @Query('lon') lon: string,
    @Query('days') days: number = 7,
  ) {
    return this.weatherService.getForecastByCoords(+lat, +lon, days);
  }
}
