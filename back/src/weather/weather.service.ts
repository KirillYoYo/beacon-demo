import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
import {
  CityOrderByInput,
  CityWhereInput,
  ForecastOrderByInput,
  ForecastWhereInput,
} from '@src/weather/dto/weather.inputs';

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);
  private readonly OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';

  constructor(private prisma: PrismaService) {}

  // Расписание: каждый день в 00:00
  @Cron('0 0 * * *')
  async refreshAllForecasts() {
    this.logger.log('Запуск ежедневного обновления прогнозов');
    const cities = await this.prisma.city.findMany();

    for (const city of cities) {
      await this.fetchAndSaveCityForecast(city);
    }

    this.logger.log('Обновление прогнозов завершено');
  }

  // Загрузка прогноза для одного города
  async fetchAndSaveCityForecast(city: any) {
    try {
      const url = `${this.OPEN_METEO_URL}?latitude=${city.lat}&longitude=${city.lon}&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,pressure_msl&timezone=auto&forecast_days=7`;
      const response = await axios.get(url);
      const data = response.data;

      const forecasts = data.hourly.time.map((time: string, index: number) => ({
        cityId: city.id,
        datetime: new Date(time),
        temperature: data.hourly.temperature_2m[index],
        feelsLike: data.hourly.temperature_2m[index], // нет feels_like в Open-Meteo
        humidity: data.hourly.relative_humidity_2m[index],
        pressure: data.hourly.pressure_msl[index],
        windSpeed: data.hourly.wind_speed_10m[index],
        windDir: null,
        description: null,
        icon: null,
        source: 'open-meteo',
      }));

      // Используем транзакцию для массовой записи
      await this.prisma.$transaction(
        forecasts.map((forecast) =>
          this.prisma.weatherForecast.upsert({
            where: {
              cityId_datetime: {
                cityId: forecast.cityId,
                datetime: forecast.datetime,
              },
            },
            update: {
              temperature: forecast.temperature,
              feelsLike: forecast.feelsLike,
              humidity: forecast.humidity,
              pressure: forecast.pressure,
              windSpeed: forecast.windSpeed,
              windDir: forecast.windDir,
              description: forecast.description,
              icon: forecast.icon,
              source: forecast.source,
            },
            create: forecast,
          }),
        ),
      );

      this.logger.log(`Прогноз для города ${city.name} обновлён`);
    } catch (error) {
      this.logger.error(`Ошибка для ${city.name}: ${error.message}`);
    }
  }

  // Получение прогноза по городу (для API)
  async getForecast(cityId: number, days: number = 7) {
    const now = new Date();
    const until = new Date();
    until.setDate(until.getDate() + days);

    return this.prisma.weatherForecast.findMany({
      where: {
        cityId,
        datetime: {
          gte: now,
          lte: until,
        },
      },
      orderBy: { datetime: 'asc' },
    });
  }

  // Получить прогноз по координатам (или имени города)
  async getForecastByCoords(lat: number, lon: number, days: number = 7) {
    const city = await this.prisma.city.findFirst({
      where: { lat, lon },
    });

    if (!city) {
      throw new Error('City not found');
    }

    return this.getForecast(city.id, days);
  }

  async getCities(options?: {
    where?: CityWhereInput;
    orderBy?: CityOrderByInput;
    skip?: number;
    take?: number;
  }) {
    const { where, orderBy, skip, take } = options || {};
    return this.prisma.city.findMany({
      where: this.buildCityWhere(where),
      orderBy: orderBy ? this.transformOrderBy(orderBy) : undefined,
      skip: skip || undefined,
      take: take || undefined,
    });
  }

  // Получить город по ID
  async getCityById(id: number) {
    return this.prisma.city.findUnique({
      where: { id },
    });
  }

  // Получить город по имени (точное совпадение)
  async getCityByName(name: string) {
    return this.prisma.city.findFirst({
      where: { name },
    });
  }

  // Получить город вместе с его прогнозами (с фильтрацией прогнозов)
  async getCityWithForecasts(
    cityId: number,
    forecastOptions?: {
      where?: ForecastWhereInput;
      orderBy?: ForecastOrderByInput;
      skip?: number;
      take?: number;
    },
  ) {
    const { where, orderBy, skip, take } = forecastOptions || {};
    return this.prisma.city.findUnique({
      where: { id: cityId },
      include: {
        forecasts: {
          where: this.buildForecastWhere(where),
          orderBy: orderBy ? this.transformOrderBy(orderBy) : undefined,
          skip: skip || undefined,
          take: take || undefined,
        },
      },
    });
  }

  // Получить прогнозы (глобально) с фильтрацией, сортировкой и пагинацией
  async getForecasts(options?: {
    where?: ForecastWhereInput;
    orderBy?: ForecastOrderByInput;
    skip?: number;
    take?: number;
  }) {
    const { where, orderBy, skip, take } = options || {};
    return this.prisma.weatherForecast.findMany({
      where: this.buildForecastWhere(where),
      orderBy: orderBy ? this.transformOrderBy(orderBy) : undefined,
      skip: skip || undefined,
      take: take || undefined,
    });
  }

  // ---------- ВСПОМОГАТЕЛЬНЫЕ ПРИВАТНЫЕ МЕТОДЫ ----------

  private buildCityWhere(where?: CityWhereInput): any {
    if (!where) return {};
    const result: any = {};
    if (where.id !== undefined) result.id = where.id;
    if (where.country) result.country = where.country;
    if (where.name) result.name = where.name; // точное совпадение
    if (where.nameContains) {
      result.name = {
        contains: where.nameContains,
        mode: where.nameMode || 'insensitive',
      };
    }
    return result;
  }

  private buildForecastWhere(where?: ForecastWhereInput): any {
    if (!where) return {};
    const result: any = {};

    if (where.cityId !== undefined) result.cityId = where.cityId;
    if (where.source) result.source = where.source;

    // Фильтр по датам
    const datetimeFilter: any = {};
    if (where.datetimeGte) datetimeFilter.gte = new Date(where.datetimeGte);
    if (where.datetimeLte) datetimeFilter.lte = new Date(where.datetimeLte);
    if (where.datetimeLt) datetimeFilter.lt = new Date(where.datetimeLt);
    if (where.datetimeGt) datetimeFilter.gt = new Date(where.datetimeGt);
    if (Object.keys(datetimeFilter).length) {
      result.datetime = datetimeFilter;
    }

    // Фильтры по температуре
    if (
      where.temperatureGte !== undefined ||
      where.temperatureLte !== undefined
    ) {
      result.temperature = {};
      if (where.temperatureGte !== undefined)
        result.temperature.gte = where.temperatureGte;
      if (where.temperatureLte !== undefined)
        result.temperature.lte = where.temperatureLte;
    }

    // Фильтры по давлению
    if (where.pressureGte !== undefined || where.pressureLte !== undefined) {
      result.pressure = {};
      if (where.pressureGte !== undefined)
        result.pressure.gte = where.pressureGte;
      if (where.pressureLte !== undefined)
        result.pressure.lte = where.pressureLte;
    }

    // Фильтры по влажности
    if (where.humidityGte !== undefined || where.humidityLte !== undefined) {
      result.humidity = {};
      if (where.humidityGte !== undefined)
        result.humidity.gte = where.humidityGte;
      if (where.humidityLte !== undefined)
        result.humidity.lte = where.humidityLte;
    }

    return result;
  }

  private transformOrderBy(orderBy: any): any {
    if (!orderBy) return undefined;
    const result: any = {};
    for (const key of Object.keys(orderBy)) {
      const value = orderBy[key];
      if (typeof value === 'string') {
        result[key] = value.toLowerCase();
      } else {
        result[key] = value;
      }
    }

    return result;
  }
}