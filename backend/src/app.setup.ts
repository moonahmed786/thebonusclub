import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { APP_CONFIG, AppConfig } from './config/app-config';
import { HttpExceptionFilter } from './shared/errors/http-exception.filter';
import { AppLogger } from './shared/logger/app-logger';
import { PARTNER_API_KEY_HEADER } from './shared/auth/partner-api-key.guard';

export const API_PREFIX = 'api/v1';

export function buildOpenApiDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('The Bonus Club API')
    .setDescription(
      'Members app API. Errors always use `{ "error": { "code", "message", "requestId" } }`. ' +
        'Every response carries an `x-request-id` header.',
    )
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
    .addApiKey({ type: 'apiKey', in: 'header', name: PARTNER_API_KEY_HEADER }, 'partner-key')
    .build();
  return SwaggerModule.createDocument(app, config);
}

/** Shared by the local server, the Vercel handler, and tests. */
export function configureApp(app: INestApplication): void {
  const config = app.get<AppConfig>(APP_CONFIG);
  const logger = app.get(AppLogger);

  app.useLogger(logger);
  app.setGlobalPrefix(API_PREFIX);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      stopAtFirstError: false,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter(logger));
  app.enableShutdownHooks();

  const http = app.getHttpAdapter().getInstance() as { disable?: (setting: string) => void; set?: (k: string, v: unknown) => void };
  http.disable?.('x-powered-by');
  // Vercel sits in front of the function; trust its forwarded client IP for rate limiting.
  http.set?.('trust proxy', 1);

  if (config.swaggerEnabled) {
    SwaggerModule.setup('api-docs', app, buildOpenApiDocument(app));
  }
}
