import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ItsmIntegration, ItsmIntegrationSchema } from './schemas/itsm-integration.schema';
import { ItsmIntegrationsService } from './itsm-integrations.service';
import { ItsmIntegrationsController } from './itsm-integrations.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ItsmIntegration.name, schema: ItsmIntegrationSchema },
    ]),
  ],
  controllers: [ItsmIntegrationsController],
  providers: [ItsmIntegrationsService],
  exports: [ItsmIntegrationsService],
})
export class ItsmIntegrationsModule {}
