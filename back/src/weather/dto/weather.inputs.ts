import { InputType, Field, Int } from '@nestjs/graphql';

// todo генерировать TS типы каким нибудь graphql-codegen

@InputType()
export class CityWhereInput {
  @Field({ nullable: true })
  id?: number;

  @Field({ nullable: true })
  country?: string;

  // Точное совпадение по имени
  @Field({ nullable: true })
  name?: string;

  // Поиск по части названия (содержит)
  @Field({ nullable: true })
  nameContains?: string;

  // Режим регистронезависимости (insensitive) – опционально
  @Field({ nullable: true })
  nameMode?: 'insensitive';
}

@InputType()
export class CityOrderByInput {
  @Field({ nullable: true })
  name?: 'asc' | 'desc';

  @Field({ nullable: true })
  population?: 'asc' | 'desc';
}

@InputType()
export class ForecastOrderByInput {
  @Field({ nullable: true })
  datetime?: 'asc' | 'desc';

  @Field({ nullable: true })
  temperature?: 'asc' | 'desc';
}

@InputType()
export class ForecastWhereInput {
  @Field(() => Int, { nullable: true })
  cityId?: number;

  @Field({ nullable: true })
  datetimeGte?: string;

  @Field({ nullable: true })
  datetimeLte?: string;

  @Field({ nullable: true })
  datetimeLt?: string;

  @Field({ nullable: true })
  datetimeGt?: string;

  @Field({ nullable: true })
  source?: string;

  // --- Новые поля для фильтрации по диапазонам ---
  @Field({ nullable: true })
  temperatureGte?: number;

  @Field({ nullable: true })
  temperatureLte?: number;

  @Field(() => Int, { nullable: true })
  pressureGte?: number;

  @Field(() => Int, { nullable: true })
  pressureLte?: number;

  @Field(() => Int, { nullable: true })
  humidityGte?: number;

  @Field(() => Int, { nullable: true })
  humidityLte?: number;
}