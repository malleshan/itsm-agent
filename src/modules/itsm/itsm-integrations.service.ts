import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ItsmIntegration, ItsmIntegrationDocument, IntegrationStatus } from './schemas/itsm-integration.schema';
import { UpsertIntegrationDto } from './dto/upsert-integration.dto';
import { CacheService } from '../../cache/cache.service';
import { AdapterCredentials } from '../../common/interfaces/adapter.interface';

const CACHE_TTL = 300; // 5 minutes

@Injectable()
export class ItsmIntegrationsService {
  private readonly logger = new Logger(ItsmIntegrationsService.name);

  constructor(
    @InjectModel(ItsmIntegration.name)
    private readonly model: Model<ItsmIntegrationDocument>,
    private readonly cache: CacheService,
  ) {}

  async upsert(dto: UpsertIntegrationDto): Promise<ItsmIntegrationDocument> {
    const doc = await this.model.findOneAndUpdate(
      { tenantId: dto.tenantId, service: dto.service, deletedAt: null },
      {
        $set: {
          enabled: dto.enabled ?? true,
          ...(dto.credentials ? { credentials: dto.credentials } : {}),
          status: IntegrationStatus.ACTIVE,
        },
      },
      { upsert: true, new: true },
    );
    await this.cache.del(this.cacheKey(dto.tenantId));
    this.logger.log(`Integration upserted: ${dto.service} for tenant ${dto.tenantId}`);
    return doc;
  }

  async findAllByTenant(tenantId: string): Promise<ItsmIntegrationDocument[]> {
    const cacheKey = this.cacheKey(tenantId);
    const cached = await this.cache.get<ItsmIntegrationDocument[]>(cacheKey);
    if (cached) return cached;

    const docs = await this.model
      .find({ tenantId, deletedAt: null })
      .sort({ service: 1 })
      .exec();

    await this.cache.set(cacheKey, docs, CACHE_TTL);
    return docs;
  }

  async findOne(tenantId: string, service: string): Promise<ItsmIntegrationDocument> {
    const doc = await this.model.findOne({ tenantId, service, deletedAt: null }).exec();
    if (!doc) throw new NotFoundException(`Integration ${service} not found for tenant ${tenantId}`);
    return doc;
  }

  async disable(tenantId: string, service: string): Promise<void> {
    await this.model.findOneAndUpdate(
      { tenantId, service },
      { $set: { deletedAt: new Date(), enabled: false } },
    );
    await this.cache.del(this.cacheKey(tenantId));
    this.logger.log(`Integration disabled: ${service} for tenant ${tenantId}`);
  }

  /** Returns only enabled tool names — used by provisioning. Cached. */
  async getEnabledTools(tenantId: string): Promise<string[]> {
    const integrations = await this.findAllByTenant(tenantId);
    return integrations.filter((i) => i.enabled).map((i) => i.service);
  }

  /** Returns decrypted credentials for a tenant — used by provisioning. */
  async getCredentials(tenantId: string): Promise<AdapterCredentials> {
    const integrations = await this.findAllByTenant(tenantId);
    const creds: AdapterCredentials = {};
    for (const i of integrations) {
      if (i.enabled && i.credentials && Object.keys(i.credentials).length > 0) {
        (creds as any)[i.service] = i.credentials;
      }
    }
    return creds;
  }

  async markError(tenantId: string, service: string, message: string): Promise<void> {
    await this.model.findOneAndUpdate(
      { tenantId, service },
      { $set: { status: IntegrationStatus.ERROR, lastErrorMessage: message } },
    );
  }

  async markTested(tenantId: string, service: string): Promise<void> {
    await this.model.findOneAndUpdate(
      { tenantId, service },
      { $set: { lastTestedAt: new Date(), status: IntegrationStatus.ACTIVE } },
    );
  }

  /** Summary metrics for the tenant */
  async getMetrics(tenantId: string): Promise<Record<string, any>> {
    const integrations = await this.findAllByTenant(tenantId);
    return {
      total: integrations.length,
      enabled: integrations.filter((i) => i.enabled).length,
      disabled: integrations.filter((i) => !i.enabled).length,
      error: integrations.filter((i) => i.status === IntegrationStatus.ERROR).length,
      services: integrations.map((i) => ({
        service: i.service,
        enabled: i.enabled,
        status: i.status,
        lastTestedAt: i.lastTestedAt,
      })),
    };
  }

  private cacheKey(tenantId: string) {
    return `itsm:integrations:${tenantId}`;
  }
}
