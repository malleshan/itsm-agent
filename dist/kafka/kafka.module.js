"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KafkaModule = void 0;
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const config_1 = require("@nestjs/config");
const kafka_producer_service_1 = require("./kafka.producer.service");
const kafka_constants_1 = require("./kafka.constants");
let KafkaModule = class KafkaModule {
};
exports.KafkaModule = KafkaModule;
exports.KafkaModule = KafkaModule = __decorate([
    (0, common_1.Module)({
        imports: [
            microservices_1.ClientsModule.registerAsync([
                {
                    name: kafka_constants_1.KAFKA_CLIENT,
                    imports: [config_1.ConfigModule],
                    inject: [config_1.ConfigService],
                    useFactory: (config) => ({
                        transport: microservices_1.Transport.KAFKA,
                        options: {
                            client: {
                                clientId: config.get('kafka.clientId'),
                                brokers: [config.get('kafka.broker')],
                            },
                            producer: {
                                allowAutoTopicCreation: true,
                            },
                        },
                    }),
                },
            ]),
        ],
        providers: [kafka_producer_service_1.KafkaProducerService],
        exports: [kafka_producer_service_1.KafkaProducerService],
    })
], KafkaModule);
//# sourceMappingURL=kafka.module.js.map