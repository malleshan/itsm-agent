import { OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
export interface EmployeeEvent {
    employeeId: string;
    tenantId: string;
    name: string;
    email: string;
    role: string;
    department?: string;
}
export declare class KafkaProducerService implements OnModuleInit {
    private readonly kafkaClient;
    private readonly config;
    private readonly logger;
    private kafkaReady;
    constructor(kafkaClient: ClientKafka, config: ConfigService);
    onModuleInit(): Promise<void>;
    publishOnboarded(payload: EmployeeEvent): Promise<void>;
    publishOffboarded(payload: EmployeeEvent): Promise<void>;
}
