import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { CustomLoggerService } from './shared/common/logger/logger.service';
import { MetricsInterceptor } from './shared/common/interceptors/metrics.interceptor';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { runSeed } from 'prisma/seed';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  try {
    await runSeed();

    const app = await NestFactory.create(AppModule, {
      // Importante: Habilitar CORS na criação do app para WebSockets
      cors: true,
    });
    const logger = app.get(CustomLoggerService);

    // CRITICAL: Configurar WebSocket adapter ANTES de qualquer outra coisa
    app.useWebSocketAdapter(new IoAdapter(app));

    const corsAllowList = new Set([
      'https://api.weliv.com.br',
      'https://api.weliv.com',
      'http://31.97.166.94',
      'http://localhost:4200',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:42100',
      'http://127.0.0.1:42100',
    ]);
    /** Vite pode subir em qualquer porta (5174, 3000, etc.) — evita falha de CORS confundida com "rede". */
    const isLocalDevOrigin = (o: string) =>
      /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(o);

    app.enableCors({
      origin: (requestOrigin, callback) => {
        if (!requestOrigin) {
          callback(null, true);
          return;
        }
        if (corsAllowList.has(requestOrigin) || isLocalDevOrigin(requestOrigin)) {
          callback(null, true);
          return;
        }
        callback(null, false);
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
      preflightContinue: false,
      optionsSuccessStatus: 204,
    });

    app.useGlobalPipes(
      new ValidationPipe({
        errorHttpStatusCode: 422,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
        whitelist: true,
        forbidNonWhitelisted: true,
        disableErrorMessages: false,
      }),
    );

    app.useGlobalInterceptors(new MetricsInterceptor());

    const swaggerConfig = new DocumentBuilder()
      .setTitle('Weliv API')
      .setDescription('Documentacao da API Weliv')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api', app, swaggerDocument);

    const port = process.env.PORT ?? 30100;  // weliv: bloco 30xxx
    await app.listen(port);

    logger.log(`🚀 Aplicação iniciada na porta ${port}`, 'Bootstrap');
    logger.log(
      `🔌 WebSocket habilitado em ws://localhost:${port}`,
      'Bootstrap',
    );
    logger.log(
      `📡 Gateway de notificações: ws://localhost:${port}`,
      'Bootstrap',
    );
    logger.log(
      `📊 Health check disponível em http://localhost:${port}/health`,
      'Bootstrap',
    );
    logger.log(
      `📈 Métricas disponíveis em http://localhost:${port}/metrics`,
      'Bootstrap',
    );
    logger.log(
      `📚 Swagger disponível em http://localhost:${port}/api`,
      'Bootstrap',
    );
  } catch (error) {
    console.error('❌ Erro ao iniciar aplicação:', error);
    process.exit(1);
  }
}
bootstrap();
