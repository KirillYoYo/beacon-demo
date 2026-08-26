import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { URI_FOR_CORS } from '../consts';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const corsOrigin = process.env.FRONTEND_URL || URI_FOR_CORS;

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();