import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TenantConfig, TenantConfigSchema } from './schemas/tenant-config.schema';
import { TenantConfigService } from './tenant-config.service';
import { TenantConfigController } from './tenant-config.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: TenantConfig.name, schema: TenantConfigSchema }]),
  ],
  controllers: [TenantConfigController],
  providers: [TenantConfigService],
  exports: [TenantConfigService],
})
export class TenantConfigModule {}
