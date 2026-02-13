import type { INestApplication } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { apiReference } from '@scalar/nestjs-api-reference'
import { cleanupOpenApiDoc } from 'nestjs-zod'

/**
 * Sets up API documentation with Scalar UI
 * Uses sources to combine NestJS and Better Auth specs
 */
export function setupOpenApi(app: INestApplication): void {
  // NestJS OpenAPI spec
  const openApiDoc = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Marifa API')
      .setDescription('Marifa API documentation')
      .setVersion('1.0.0')
      .build()
  )

  const cleanedDoc = cleanupOpenApiDoc(openApiDoc)

  // Serve raw NestJS OpenAPI JSON
  app.getHttpAdapter().get('/api/doc', (_req, res) => {
    res.json(cleanedDoc)
  })

  // Scalar API Reference with multiple sources
  app.use(
    '/api/reference',
    apiReference({
      theme: 'deepSpace',
      sources: [
        { url: '/api/doc', title: 'API' },
        { url: '/api/auth/open-api/generate-schema', title: 'Auth' }
      ]
    })
  )
}
