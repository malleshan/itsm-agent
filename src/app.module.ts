import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import configuration from './config/configuration';
import { EmployeeModule } from './modules/employee/employee.module';
import { LogsModule } from './modules/logs/logs.module';
import { ProvisioningModule } from './modules/provisioning/provisioning.module';
import { KafkaModule } from './kafka/kafka.module';
import { AppCacheModule } from './cache/cache.module';
import { ItsmIntegrationsModule } from './modules/itsm/itsm-integrations.module';
import { AiRecommendationModule } from './modules/ai-recommendation/ai-recommendation.module';
import { TenantConfigModule } from './modules/tenant-config/tenant-config.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: '.env',
    }),

    MongooseModule.forRoot(process.env.MONGO_URI || process.env.MONGO_URI_LOCAL, {
      connectionFactory: (connection) => {
        connection.on('connected', () =>
          console.log('[Mongoose] Connected to MongoDB'),
        );
        connection.on('error', (err) =>
          console.error('[Mongoose] Connection error:', err.message),
        );
        return connection;
      },
    }),

    AppCacheModule,
    KafkaModule,
    EmployeeModule,
    LogsModule,
    ItsmIntegrationsModule,
    AiRecommendationModule,
    TenantConfigModule,
    ProvisioningModule,
  ],
})
export class AppModule {}
