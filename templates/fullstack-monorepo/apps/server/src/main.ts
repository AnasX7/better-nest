import { NestFactory } from '@nestjs/core'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { apiReference } from '@scalar/nestjs-api-reference'
import fastifyCompress from '@fastify/compress'
import fastifyHelmet from '@fastify/helmet'
import { StandardSchemaValidationPipe } from '@nestjs/common'
import { Logger } from 'nestjs-pino'
import { HttpExceptionFilter } from '@/common/filters/http-exception.filter'
import { ConfigService } from '@/config/config.service'
import { AppModule } from '@/app.module'

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), {
    bufferLogs: true,
    bodyParser: false,
  })

  app.useLogger(app.get(Logger))
  app.enableShutdownHooks()

  await app.register(fastifyCompress, {
    encodings: ['gzip', 'deflate'],
  })

  await app.register(fastifyHelmet, {
    contentSecurityPolicy: false,
  })

  app.setGlobalPrefix('api', {
    exclude: ['health', 'docs'],
  })

  app.useGlobalPipes(new StandardSchemaValidationPipe())
  app.useGlobalFilters(new HttpExceptionFilter())

  const config = app.get(ConfigService)
  const trustedOrigins = config
    .get('TRUSTED_ORIGINS')
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean) || ['http://localhost:3000']

  app.enableCors({
    origin: trustedOrigins,
    credentials: true,
  })

  if (!config.isProduction || config.get('ENABLE_DOCS')) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('NestJS v12 API')
      .setDescription('NestJS v12 + Fastify + Drizzle + Better Auth API')
      .setVersion('1.0')
      .addBearerAuth()
      .build()

    const document = SwaggerModule.createDocument(app, swaggerConfig)

    app.use(
      '/docs',
      apiReference({
        withFastify: true,
        spec: {
          content: document,
        },
      }),
    )
  }

  const port = config.get('PORT')

  await app.listen({
    port,
    host: '0.0.0.0',
  })
}
await bootstrap()
