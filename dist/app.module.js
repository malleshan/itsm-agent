"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const configuration_1 = require("./config/configuration");
const employee_module_1 = require("./modules/employee/employee.module");
const logs_module_1 = require("./modules/logs/logs.module");
const provisioning_module_1 = require("./modules/provisioning/provisioning.module");
const kafka_module_1 = require("./kafka/kafka.module");
const cache_module_1 = require("./cache/cache.module");
const itsm_integrations_module_1 = require("./modules/itsm/itsm-integrations.module");
const ai_recommendation_module_1 = require("./modules/ai-recommendation/ai-recommendation.module");
const tenant_config_module_1 = require("./modules/tenant-config/tenant-config.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [configuration_1.default],
                envFilePath: '.env',
            }),
            mongoose_1.MongooseModule.forRoot(process.env.MONGO_URI, {
                connectionFactory: (connection) => {
                    connection.on('connected', () => console.log('[Mongoose] Connected to MongoDB'));
                    connection.on('error', (err) => console.error('[Mongoose] Connection error:', err.message));
                    return connection;
                },
            }),
            cache_module_1.AppCacheModule,
            kafka_module_1.KafkaModule,
            employee_module_1.EmployeeModule,
            logs_module_1.LogsModule,
            itsm_integrations_module_1.ItsmIntegrationsModule,
            ai_recommendation_module_1.AiRecommendationModule,
            tenant_config_module_1.TenantConfigModule,
            provisioning_module_1.ProvisioningModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map