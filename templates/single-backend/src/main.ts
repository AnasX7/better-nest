import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { setupOpenApi } from './common/openapi/openapi.setup';
import { AppModule } from './app.module';
import { EnvService } from './config/env.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const logger = new Logger(bootstrap.name);
  const env = app.get(EnvService);

  const PORT = env.get('PORT');
  const isProduction = env.get('NODE_ENV') === 'production';

  // API Documentation
  if (!isProduction) {
    setupOpenApi(app);
  }

  app.enableCors({
    origin: env.get('CORS_ORIGIN'),
    credentials: true,
  });

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net'],
          imgSrc: ["'self'", 'data:', 'cdn.jsdelivr.net'],
        },
      },
    }),
  );

  app.use(compression());
  app.use(morgan(isProduction ? 'combined' : 'dev'));

  await app.listen(PORT, () => {
    logger.log(`Server is listening at port ${PORT}`);
    if (!isProduction) {
      logger.log(
        `API docs available at http://localhost:${PORT}/api/reference`,
      );
    }
  });
}
void bootstrap();
