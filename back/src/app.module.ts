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
        }),
        AuthModule,
        UsersModule,
        PrismaModule
    ],
    controllers: [AppController],
    providers: [AppService, AppResolver],
})
export class AppModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(CorsMiddleware).forRoutes('person');
    }
}