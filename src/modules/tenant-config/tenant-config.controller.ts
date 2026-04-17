import { Body, Controller, Get, Param, Put, HttpCode, HttpStatus } from '@nestjs/common';
import { TenantConfigService } from './tenant-config.service';
import { UpsertTenantConfigDto } from './dto/upsert-tenant-config.dto';

@Controller('tenant-config')
export class TenantConfigController {
  constructor(private readonly tenantConfigService: TenantConfigService) {}

  /** PUT /tenant-config — create or update a tenant's configuration. */
  @Put()
  @HttpCode(HttpStatus.OK)
  async upsert(@Body() dto: UpsertTenantConfigDto) {
    return this.tenantConfigService.upsert(dto);
  }

  /** GET /tenant-config — list all tenant configurations. */
  @Get()
  async findAll() {
    return this.tenantConfigService.findAll();
  }

  /** GET /tenant-config/:tenantId */
  @Get(':tenantId')
  async findOne(@Param('tenantId') tenantId: string) {
    return this.tenantConfigService.getOrFail(tenantId);
  }
}
