import {ObjectType, Field, Int, Float, InputType} from '@nestjs/graphql';
import { WeatherForecast } from './forecast.dto';

@ObjectType()
export class City {
    @Field(() => Int)
    id: number;

    @Field()
    name: string;

    @Field()
    country: string;

    @Field(() => Float)
    lat: number;

    @Field(() => Float)
    lon: number;

    @Field({ nullable: true })
    timezone?: string;

    @Field(() => Int, { nullable: true })
    population?: number;

    @Field(() => [WeatherForecast], { nullable: true })
    forecasts?: WeatherForecast[];
}