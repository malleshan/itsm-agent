import { Module } from '@nestjs/common';
import { ProvisioningService } from './provisioning.service';
import { ProvisioningController } from './provisioning.controller';
import { LogsModule } from '../logs/logs.module';
import { AdaptersModule } from '../../adapters/adapters.module';
import { EmailModule } from '../email/email.module';
import { ItsmIntegrationsModule } from '../itsm/itsm-integrations.module';
import { AiRecommendationModule } from '../ai-recommendation/ai-recommendation.module';

@Module({
  imports: [LogsModule, AdaptersModule, EmailModule, ItsmIntegrationsModule, AiRecommendationModule],
  controllers: [ProvisioningController],
  providers: [ProvisioningService],
  exports: [ProvisioningService],
})
export class ProvisioningModule {}
