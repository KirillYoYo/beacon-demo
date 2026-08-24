import {
  Resolver,
  Query,
  Args,
  Int,
  Parent,
  ResolveField,
} from '@nestjs/graphql';
import { WeatherService } from './weather.service';
import { City } from './dto/city.dto';
import { WeatherForecast } from './dto/forecast.dto';
import {
  CityOrderByInput,
  CityWhereInput,
  ForecastOrderByInput,
  ForecastWhereInput,
} from '@src/weather/dto/weather.inputs';

@Resolver()
export class WeatherResolver {
  constructor(private weatherService: WeatherService) {}

  @Query(() => [City])
  async cities(
    @Args('where', { nullable: true }) where?: CityWhereInput,
    @Args('orderBy', { nullable: true }) orderBy?: CityOrderByInput,
    @Args('skip', { nullable: true, type: () => Int }) skip?: number,
    @Args('take', { nullable: true, type: () => Int }) take?: number,
  ) {
    return this.weatherService.getCities({ where, orderBy, skip, take }); // ✅ теперь работает
  }

  @Query(() => City, { nullable: true })
  async city(@Args('id', { type: () => Int }) id: number) {
    return this.weatherService.getCityById(id);
  }

  @Query(() => City, { nullable: true })
  async cityByName(@Args('name') name: string) {
    return this.weatherService.getCityByName(name);
  }

  @Query(() => [WeatherForecast])
  async forecasts(
    @Args('where', { nullable: true }) where?: ForecastWhereInput,
    @Args('orderBy', { nullable: true }) orderBy?: ForecastOrderByInput,
    @Args('skip', { nullable: true, type: () => Int }) skip?: number,
    @Args('take', { nullable: true, type: () => Int }) take?: number,
  ) {
    return this.weatherService.getForecasts({ where, orderBy, skip, take });
  }
}

/**/

@Resolver(() => City)
export class CityFieldResolver {
  constructor(private weatherService: WeatherService) {}

  @ResolveField(() => [WeatherForecast])
  async forecasts(
    @Parent() city: City,
    @Args('where', { nullable: true }) where?: ForecastWhereInput,
    @Args('orderBy', { nullable: true }) orderBy?: ForecastOrderByInput,
    @Args('skip', { nullable: true, type: () => Int }) skip?: number,
    @Args('take', { nullable: true, type: () => Int }) take?: number,
  ) {
    // Добавляем cityId в фильтр, чтобы прогнозы были только для этого города
    const mergedWhere = { ...where, cityId: city.id };
    return this.weatherService.getForecasts({
      where: mergedWhere,
      orderBy,
      skip,
      take,
    });
  }
}
