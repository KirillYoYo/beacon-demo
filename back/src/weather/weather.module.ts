import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { WeatherService } from './weather.service';
import { WeatherController } from './weather.controller';
import { WeatherImportService } from './weather-import.service';
import { PrismaModule } from '../../prisma/prisma.module';
import {
  CityFieldResolver,
  WeatherResolver,
} from '@src/weather/weather.resolver';

@Module({
  imports: [PrismaModule, ScheduleModule.forRoot()],
  providers: [
    WeatherService,
    WeatherImportService,
    WeatherResolver,
    CityFieldResolver,
  ],
  controllers: [WeatherController],
  exports: [WeatherService],
})
export class WeatherModule {}
