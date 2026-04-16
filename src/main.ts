// Load .env before anything else — this ensures process.env is populated
// before NestJS modules are initialised.
import 'dotenv/config';

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Connect Kafka microservice (hybrid: HTTP + Kafka consumer)
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: process.env.KAFKA_CLIENT_ID || 'itsm-consumer',
        brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
      },
      consumer: {
        groupId: process.env.KAFKA_CONSUMER_GROUP_ID || 'itsm-consumer-group',
      },
    },
  });

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Start Kafka consumer — gracefully skip if broker is unavailable in dev
  try {
    await app.startAllMicroservices();
    logger.log(`Kafka consumer connected to ${process.env.KAFKA_BROKER || 'localhost:9092'}`);
  } catch (err) {
    logger.warn(
      `Kafka broker unavailable (${err.message}). ` +
      `HTTP server will start without Kafka — events will be retried on publish.`,
    );
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`ITSM Agent running on http://localhost:${port}`);
}

bootstrap();
