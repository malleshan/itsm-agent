"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var KafkaProducerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KafkaProducerService = void 0;
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const config_1 = require("@nestjs/config");
const kafka_constants_1 = require("./kafka.constants");
let KafkaProducerService = KafkaProducerService_1 = class KafkaProducerService {
    constructor(kafkaClient, config) {
        this.kafkaClient = kafkaClient;
        this.config = config;
        this.logger = new common_1.Logger(KafkaProducerService_1.name);
        this.kafkaReady = false;
    }
    async onModuleInit() {
        try {
            await this.kafkaClient.connect();
            this.kafkaReady = true;
            this.logger.log('Kafka producer connected');
        }
        catch (err) {
            this.logger.warn(`Kafka producer could not connect: ${err.message}. ` +
                `Events will be dropped until the broker is available.`);
        }
    }
    async publishOnboarded(payload) {
        if (!this.kafkaReady) {
            this.logger.warn(`Kafka unavailable — skipping onboarded event for ${payload.email}`);
            return;
        }
        const topic = this.config.get('kafka.topics.onboarded');
        this.logger.log(`Publishing to [${topic}]: ${payload.email} onboarded`);
        await this.kafkaClient
            .emit(topic, { key: payload.employeeId, value: JSON.stringify(payload) })
            .toPromise();
    }
    async publishOffboarded(payload) {
        if (!this.kafkaReady) {
            this.logger.warn(`Kafka unavailable — skipping offboarded event for ${payload.email}`);
            return;
        }
        const topic = this.config.get('kafka.topics.offboarded');
        this.logger.log(`Publishing to [${topic}]: ${payload.email} offboarded`);
        await this.kafkaClient
            .emit(topic, { key: payload.employeeId, value: JSON.stringify(payload) })
            .toPromise();
    }
};
exports.KafkaProducerService = KafkaProducerService;
exports.KafkaProducerService = KafkaProducerService = KafkaProducerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(kafka_constants_1.KAFKA_CLIENT)),
    __metadata("design:paramtypes", [microservices_1.ClientKafka,
        config_1.ConfigService])
], KafkaProducerService);
//# sourceMappingURL=kafka.producer.service.js.map