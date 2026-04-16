import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { KAFKA_CLIENT } from './kafka.constants';

export interface EmployeeEvent {
  employeeId: string;
  tenantId: string;
  name: string;
  email: string;
  role: string;
  department?: string;
}

@Injectable()
export class KafkaProducerService implements OnModuleInit {
  private readonly logger = new Logger(KafkaProducerService.name);
  private kafkaReady = false;

  constructor(
    @Inject(KAFKA_CLIENT)
    private readonly kafkaClient: ClientKafka,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    try {
      await this.kafkaClient.connect();
      this.kafkaReady = true;
      this.logger.log('Kafka producer connected');
    } catch (err) {
      this.logger.warn(
        `Kafka producer could not connect: ${err.message}. ` +
        `Events will be dropped until the broker is available.`,
      );
    }
  }

  async publishOnboarded(payload: EmployeeEvent): Promise<void> {
    if (!this.kafkaReady) {
      this.logger.warn(`Kafka unavailable — skipping onboarded event for ${payload.email}`);
      return;
    }

    const topic = this.config.get<string>('kafka.topics.onboarded');
    this.logger.log(`Publishing to [${topic}]: ${payload.email} onboarded`);

    await this.kafkaClient
      .emit(topic, { key: payload.employeeId, value: JSON.stringify(payload) })
      .toPromise();
  }

  async publishOffboarded(payload: EmployeeEvent): Promise<void> {
    if (!this.kafkaReady) {
      this.logger.warn(`Kafka unavailable — skipping offboarded event for ${payload.email}`);
      return;
    }

    const topic = this.config.get<string>('kafka.topics.offboarded');
    this.logger.log(`Publishing to [${topic}]: ${payload.email} offboarded`);

    await this.kafkaClient
      .emit(topic, { key: payload.employeeId, value: JSON.stringify(payload) })
      .toPromise();
  }
}
