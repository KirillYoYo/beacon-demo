import {ObjectType, Field, Int, Float} from '@nestjs/graphql';

@ObjectType()
export class WeatherForecast {
    @Field(() => Int)
    id: number;

    @Field(() => Int)
    cityId: number;

    @Field()
    datetime: Date;

    @Field(() => Float)
    temperature: number;

    @Field(() => Float, { nullable: true })
    feelsLike?: number;

    @Field(() => Int, { nullable: true })
    humidity?: number;

    @Field(() => Int, { nullable: true })
    pressure?: number;

    @Field(() => Float, { nullable: true })
    windSpeed?: number;

    @Field(() => Int, { nullable: true })
    windDir?: number;

    @Field({ nullable: true })
    description?: string;

    @Field({ nullable: true })
    icon?: string;

    @Field({ nullable: true })
    source?: string;

    @Field()
    createdAt: Date;

    @Field()
    updatedAt: Date;
}