import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TenantConfig, TenantConfigDocument, TenantCredentials } from './schemas/tenant-config.schema';
import { UpsertTenantConfigDto } from './dto/upsert-tenant-config.dto';

@Injectable()
export class TenantConfigService {
  private readonly logger = new Logger(TenantConfigService.name);

  constructor(
    @InjectModel(TenantConfig.name)
    private readonly tenantConfigModel: Model<TenantConfigDocument>,
  ) {}

  async upsert(dto: UpsertTenantConfigDto): Promise<TenantConfigDocument> {
    const config = await this.tenantConfigModel.findOneAndUpdate(
      { tenantId: dto.tenantId },
      { $set: dto },
      { upsert: true, new: true },
    );
    this.logger.log(`TenantConfig upserted for tenant: ${dto.tenantId}`);
    return config;
  }

  async findByTenantId(tenantId: string): Promise<TenantConfigDocument | null> {
    return this.tenantConfigModel.findOne({ tenantId }).exec();
  }

  async getOrFail(tenantId: string): Promise<TenantConfigDocument> {
    const config = await this.findByTenantId(tenantId);
    if (!config) throw new NotFoundException(`No config found for tenant: ${tenantId}`);
    return config;
  }

  async getEnabledTools(tenantId: string): Promise<string[]> {
    const config = await this.findByTenantId(tenantId);
    return config?.enabledTools ?? [];
  }

  async getCredentials(tenantId: string): Promise<TenantCredentials> {
    const config = await this.findByTenantId(tenantId);
    return config?.credentials ?? {};
  }

  async getEmailDomain(tenantId: string): Promise<string> {
    const config = await this.findByTenantId(tenantId);
    return config?.companyEmailDomain ?? process.env.COMPANY_EMAIL_DOMAIN ?? 'terralogic.com';
  }

  async findAll(): Promise<TenantConfigDocument[]> {
    return this.tenantConfigModel.find().exec();
  }
}
