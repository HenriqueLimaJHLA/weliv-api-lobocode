import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/**
 * Habilita Swagger UI em `/docs` (ou `SWAGGER_PATH`).
 * Em produção só sobe se `SWAGGER_ENABLED=true`.
 */
export function setupSwagger(app: INestApplication): void {
  const port = Number(process.env.PORT) || 3000;
  const path = process.env.SWAGGER_PATH || 'docs';

  const config = new DocumentBuilder()
    .setTitle(process.env.SWAGGER_TITLE || 'Template API Lobocode')
    .setDescription(
      process.env.SWAGGER_DESCRIPTION ||
        'Documentação OpenAPI da API REST. Use Authorize para enviar o Bearer JWT.',
    )
    .setVersion(process.env.SWAGGER_VERSION || '1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Access token retornado em POST /auth/login',
      },
      'JWT-auth',
    )
    .addServer(`http://localhost:${port}`, 'Local')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(path, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
    customSiteTitle: 'API Docs',
  });
}

export function shouldEnableSwagger(): boolean {
  if (process.env.NODE_ENV === 'production') {
    return process.env.SWAGGER_ENABLED === 'true';
  }
  return process.env.SWAGGER_ENABLED !== 'false';
}
