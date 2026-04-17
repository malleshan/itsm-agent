"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const logging_interceptor_1 = require("./common/interceptors/logging.interceptor");
const logger = new common_1.Logger('Bootstrap');
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.connectMicroservice({
        transport: microservices_1.Transport.KAFKA,
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
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
    app.useGlobalInterceptors(new logging_interceptor_1.LoggingInterceptor());
    try {
        await app.startAllMicroservices();
        logger.log(`Kafka consumer connected to ${process.env.KAFKA_BROKER || 'localhost:9092'}`);
    }
    catch (err) {
        logger.warn(`Kafka broker unavailable (${err.message}). ` +
            `HTTP server will start without Kafka — events will be retried on publish.`);
    }
    const port = process.env.PORT || 3000;
    await app.listen(port);
    logger.log(`ITSM Agent running on http://localhost:${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map