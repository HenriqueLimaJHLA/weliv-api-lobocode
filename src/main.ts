import './polyfill-crypto';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { CustomLoggerService } from './shared/common/logger/logger.service';
import { setupSwagger, shouldEnableSwagger } from './config/setup-swagger';
import { MetricsInterceptor } from './shared/common/interceptors/metrics.interceptor';
import { IoAdapter } from '@nestjs/platform-socket.io';
// import { runSeed } from 'prisma/seed';

async function bootstrap() {
  try { 
  //  runSeed();

    const app = await NestFactory.create(AppModule, {
      // Importante: Habilitar CORS na criação do app para WebSockets
      cors: true,
    });
    const logger = app.get(CustomLoggerService);

    // CRITICAL: Configurar WebSocket adapter ANTES de qualquer outra coisa
    app.useWebSocketAdapter(new IoAdapter(app));

    // Configurar CORS detalhado para HTTP
    app.enableCors({
      origin: [
        'https://api.template_lobocode.com.br',   // API em produção
        'https://app.template_lobocode.com.br',   // App em produção
        'https://admin.template_lobocode.com.br', // Admin em produção
        'http://31.97.166.94',           // Nginx proxy
        'http://76.13.66.157',           // IP da VPS
        'http://76.13.66.157:3000',      // IP da VPS com porta backend
        'http://76.13.66.157:8080',      // IP da VPS com porta frontend app
        'http://76.13.66.157:8081',      // IP da VPS com porta frontend admin
        'http://localhost:3005',          // Para desenvolvimento local
        'http://localhost:3006',          // Para desenvolvimento local
        /^http:\/\/192\.168\.\d+\.\d+:\d+$/,  // IPs de rede local (desenvolvimento mobile)
        /^http:\/\/10\.\d+\.\d+\.\d+:\d+$/,   // IPs de rede local (desenvolvimento mobile)
        /^http:\/\/172\.(1[6-9]|2\d|3[01])\.\d+\.\d+:\d+$/, // IPs de rede local (desenvolvimento mobile)
      ],
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

    const swaggerEnabled = shouldEnableSwagger();
    if (swaggerEnabled) {
      setupSwagger(app);
    }

    const port = process.env.PORT ?? 3000;
    await app.listen(port);
    
    logger.log(`🚀 Aplicação iniciada na porta ${port}`, 'Bootstrap');
    if (swaggerEnabled) {
      const swaggerPath = process.env.SWAGGER_PATH || 'docs';
      logger.log(
        `📘 Swagger UI: http://localhost:${port}/${swaggerPath}`,
        'Bootstrap',
      );
    }
    logger.log(`🔌 WebSocket habilitado em ws://localhost:${port}`, 'Bootstrap');
    logger.log(`📡 Gateway de notificações: ws://localhost:${port}`, 'Bootstrap');
    logger.log(`📊 Health check disponível em http://localhost:${port}/health`, 'Bootstrap');
    logger.log(`📈 Métricas disponíveis em http://localhost:${port}/metrics`, 'Bootstrap');
  } catch (error) {
    console.error('❌ Erro ao iniciar aplicação:', error);
    process.exit(1);
  }
}
bootstrap();
