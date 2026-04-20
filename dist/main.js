"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const logging_interceptor_1 = require("./common/interceptors/logging.interceptor");
const winston_logger_1 = require("./utils/winston.logger");
function printBanner(port, broker, env, kafkaOn) {
    const W = 51;
    const pad = (s) => s.padEnd(W - 2);
    const row = (s) => `  ║ ${pad(s)} ║`;
    const top = `  ╔${'═'.repeat(W)}╗`;
    const divider = `  ╠${'═'.repeat(W)}╣`;
    const bottom = `  ╚${'═'.repeat(W)}╝`;
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
async function bootstrap() {
    const winstonLogger = new winston_logger_1.WinstonLoggerService();
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { logger: winstonLogger });
    const kafkaEnabled = process.env.KAFKA_ENABLED !== 'false';
    if (kafkaEnabled) {
        app.connectMicroservice({
            transport: microservices_1.Transport.KAFKA,
            options: {
                client: {
                    clientId: process.env.KAFKA_CLIENT_ID || 'itsm-consumer',
                    brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
                    retry: { retries: 3 },
                },
                consumer: {
                    groupId: process.env.KAFKA_CONSUMER_GROUP_ID || 'itsm-consumer-group',
                },
            },
        });
        try {
            await app.startAllMicroservices();
            winstonLogger.log(`Kafka consumer started on ${process.env.KAFKA_BROKER || 'localhost:9092'}`, 'Bootstrap');
        }
        catch (err) {
            winstonLogger.warn(`Kafka broker unreachable (${err.message}). HTTP server starting without Kafka consumer.`, 'Bootstrap');
        }
    }
    else {
        winstonLogger.warn('KAFKA_ENABLED=false — Kafka consumer disabled. Use POST /provisioning/trigger for direct testing.', 'Bootstrap');
    }
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
    app.useGlobalInterceptors(new logging_interceptor_1.LoggingInterceptor());
    const swaggerConfig = new swagger_1.DocumentBuilder()
        .setTitle('ITSM Automation Agent')
        .setDescription('API for employee onboarding/offboarding across SaaS platforms (GitHub, Slack, Jira, Zoho, Salesforce, M365, Zoom, ServiceNow, SAP, Google)')
        .setVersion('1.0.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
    swagger_1.SwaggerModule.setup('api', app, document);
    const port = process.env.PORT || 1000;
    await app.listen(port);
    printBanner(port, process.env.KAFKA_BROKER || 'localhost:9092', process.env.NODE_ENV || 'development', kafkaEnabled);
}
bootstrap();
//# sourceMappingURL=main.js.map