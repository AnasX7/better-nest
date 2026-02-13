import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import type { Request, Response } from 'express';

/**
 * Sets up API documentation with Scalar UI
 * Uses sources to combine NestJS and Better Auth specs
 */
export function setupOpenApi(app: INestApplication): void {
  // NestJS OpenAPI spec
  const openApiDoc = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('SCYN API')
      .setDescription('SCYN Backend API Documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .addSecurityRequirements('bearer')
      .addServer(
        `http://localhost:${process.env.PORT ?? 3000}`,
        'Local environment',
      )
      .build(),
  );

  // Serve raw NestJS OpenAPI JSON
  app.getHttpAdapter().get('/api/doc', (_req: Request, res: Response) => {
    res.json(openApiDoc);
  });

  // Scalar API Reference with multiple sources
  app.use(
    '/api/reference',
    apiReference({
      theme: 'deepSpace',
      operationTitleSource: 'path',
      sources: [
        { url: '/api/doc', title: 'API' },
        { url: '/api/auth/open-api/generate-schema', title: 'Auth' },
      ],
      authentication: {
        preferredSecurityScheme: 'bearer',
      },
      defaultHttpClient: {
        targetKey: 'js',
        clientKey: 'axios',
      },
    }),
  );
}
