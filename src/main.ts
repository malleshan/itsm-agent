import 'dotenv/config';

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { WinstonLoggerService } from './utils/winston.logger';

// ─── ASCII startup banner ─────────────────────────────────────────────────────
function printBanner(port: string | number, broker: string, env: string, kafkaOn: boolean): void {
  const W = 51;
  const pad = (s: string) => s.padEnd(W - 2);
  const row = (s: string) => `  ║ ${pad(s)} ║`;
  const top     = `  ╔${'═'.repeat(W)}╗`;
  const divider = `  ╠${'═'.repeat(W)}╣`;
  const bottom  = `  ╚${'═'.repeat(W)}╝`;

  console.log('\n' + [
    top,
    row('     ITSM Automation Agent   v1.0.0'),
    divider,
    row(`  HTTP     ->  http://localhost:${port}`),
    row(`  Kafka    ->  ${kafkaOn ? broker : broker + ' (DISABLED)'}`),
    row(`  MongoDB  ->  Atlas (Connected)`),
    row(`  Logs     ->  ./logs/application-<date>.log`),
    row(`  Env      ->  ${env}`),
    bottom,
  ].join('\n') + '\n');
}
// ─────────────────────────────────────────────────────────────────────────────

async function bootstrap() {
  const winstonLogger = new WinstonLoggerService();

  const app = await NestFactory.create(AppModule, { logger: winstonLogger });
  app.enableCors({ origin: process.env.CORS_ORIGIN || '*', credentials: true });

  const kafkaEnabled = process.env.KAFKA_ENABLED !== 'false';

  // ── Kafka consumer — only when KAFKA_ENABLED=true ─────────────────────────
  if (kafkaEnabled) {
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.KAFKA,
      options: {
        client: {
          clientId: process.env.KAFKA_CLIENT_ID || 'itsm-consumer',
          brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
          retry: { retries: 3 },          // don't retry forever in dev
        },
        consumer: {
          groupId: process.env.KAFKA_CONSUMER_GROUP_ID || 'itsm-consumer-group',
        },
      },
    });

    try {
      await app.startAllMicroservices();
      winstonLogger.log(
        `Kafka consumer started on ${process.env.KAFKA_BROKER || 'localhost:9092'}`,
        'Bootstrap',
      );
    } catch (err: any) {
      winstonLogger.warn(
        `Kafka broker unreachable (${err.message}). HTTP server starting without Kafka consumer.`,
        'Bootstrap',
      );
    }
  } else {
    winstonLogger.warn(
      'KAFKA_ENABLED=false — Kafka consumer disabled. Use POST /provisioning/trigger for direct testing.',
      'Bootstrap',
    );
  }

  // ── Global middleware ─────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  // ── Swagger UI ────────────────────────────────────────────────────────────
  const swaggerConfig = new DocumentBuilder()
    .setTitle('ITSM Automation Agent')
    .setDescription('API for employee onboarding/offboarding across SaaS platforms (GitHub, Slack, Jira, Zoho, Salesforce, M365, Zoom, ServiceNow, SAP, Google)')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 1000;
  await app.listen(port);

  printBanner(
    port,
    process.env.KAFKA_BROKER || 'localhost:9092',
    process.env.NODE_ENV || 'development',
    kafkaEnabled,
  );
}

bootstrap();
