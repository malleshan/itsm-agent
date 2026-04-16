import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import configuration from './config/configuration';
import { EmployeeModule } from './modules/employee/employee.module';
import { LogsModule } from './modules/logs/logs.module';
import { ProvisioningModule } from './modules/provisioning/provisioning.module';
import { KafkaModule } from './kafka/kafka.module';

@Module({
  imports: [
    // Config — global, reads .env automatically
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: '.env',
    }),

    // MongoDB — read directly from process.env so the value is always fresh
    // regardless of ConfigService initialisation order.
    MongooseModule.forRoot(process.env.MONGO_URI, {
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

    // Feature modules
    KafkaModule,
    EmployeeModule,
    LogsModule,
    ProvisioningModule,
  ],
})
export class AppModule {}
