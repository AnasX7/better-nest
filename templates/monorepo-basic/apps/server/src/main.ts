import { NestFactory } from '@nestjs/core'
import { Logger } from '@nestjs/common'

import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'

import { AppModule } from '#/app.module'
import { EnvService } from '#/config/env.service'
import { setupOpenApi } from '#/common/openapi/openapi.setup'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false
  })

  const logger = new Logger(bootstrap.name)

  const env = app.get(EnvService)
  const PORT = env.get('PORT') ?? 3000
  const isProduction = env.get('NODE_ENV') === 'production'

  // API Documentation (disabled in production)
  if (!isProduction) {
    setupOpenApi(app)
  }

  // Security
  app.enableCors({
    origin: env.get('CORS_ORIGIN'),
    credentials: true
  })

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net'],
          imgSrc: ["'self'", 'data:', 'cdn.jsdelivr.net']
        }
      }
    })
  )

  // Performance
  app.use(compression())

  // Request logging
  app.use(morgan(isProduction ? 'combined' : 'dev'))

  await app.listen(PORT, () => {
    logger.log(`Server is listening at port ${PORT}`)
    logger.log(`Current environment is: ${env.get('NODE_ENV')}`)
    if (!isProduction) {
      logger.log(`API docs available at http://localhost:${PORT}/api/reference`)
    }
  })
}

void bootstrap()
