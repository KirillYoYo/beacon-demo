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

  const port = process.env.PORT || 8080;
  console.log(`📡 PORT from env: ${process.env.PORT}`);
  console.log(`📡 Using port: ${port}`);

  await app.listen(port, '0.0.0.0');
  console.log(`✅ Server is running on port ${port}`);
}
bootstrap();