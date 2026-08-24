import {MiddlewareConsumer, Module} from '@nestjs/common';
import {AppController} from './app.controller';
import {AppService} from './app.service';
import {GraphQLModule} from '@nestjs/graphql';
import {ApolloDriver, ApolloDriverConfig} from '@nestjs/apollo';
import {ConfigModule, ConfigService} from '@nestjs/config';
import {AppResolver} from "@src/app.resolver";
import {CorsMiddleware} from "@src/middleWare";
import {PrismaModule} from "../prisma/prisma.module";
import {UsersModule} from "@src/users/users.module";
import {AuthModule} from "@src/auth/auth.module";
import {WeatherModule} from "@src/weather/weather.module";

// const isDev = process.env.NODE_ENV === 'development';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        GraphQLModule.forRoot<ApolloDriverConfig>({
            driver: ApolloDriver,
            autoSchemaFile: true,
            subscriptions: {
                'graphql-ws': false // <--- Бизнес решил пока не использовать сокеты...
            },
        }),
        AuthModule,
        UsersModule,
        PrismaModule,
        WeatherModule
    ],
    controllers: [AppController],
    providers: [AppService, AppResolver],
})
export class AppModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(CorsMiddleware).forRoutes('person');
    }
}