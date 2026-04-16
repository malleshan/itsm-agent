import { Module } from '@nestjs/common';
import { ProvisioningService } from './provisioning.service';
import { ProvisioningController } from './provisioning.controller';
import { LogsModule } from '../logs/logs.module';
import { AdaptersModule } from '../../adapters/adapters.module';

@Module({
  imports: [LogsModule, AdaptersModule],
  controllers: [ProvisioningController],
  providers: [ProvisioningService],
})
export class ProvisioningModule {}
