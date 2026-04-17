import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus,
  Param, Post, Put, Query,
} from '@nestjs/common';
import { ItsmIntegrationsService } from './itsm-integrations.service';
import { UpsertIntegrationDto } from './dto/upsert-integration.dto';

@Controller('itsm/integrations')
export class ItsmIntegrationsController {
  constructor(private readonly service: ItsmIntegrationsService) {}

  /** GET /itsm/integrations?tenantId=xxx */
  @Get()
  async list(@Query('tenantId') tenantId: string) {
    const data = await this.service.findAllByTenant(tenantId);
    return { data, total: data.length };
  }

  /** GET /itsm/integrations/metrics?tenantId=xxx */
  @Get('metrics')
  async metrics(@Query('tenantId') tenantId: string) {
    return this.service.getMetrics(tenantId);
  }

  /** GET /itsm/integrations/:service?tenantId=xxx */
  @Get(':service')
  async findOne(
    @Param('service') service: string,
    @Query('tenantId') tenantId: string,
  ) {
    return this.service.findOne(tenantId, service);
  }

  /** PUT /itsm/integrations — create or update */
  @Put()
  @HttpCode(HttpStatus.OK)
  async upsert(@Body() dto: UpsertIntegrationDto) {
    const data = await this.service.upsert(dto);
    return { data, message: `Integration ${dto.service} configured for tenant ${dto.tenantId}` };
  }

  /** POST /itsm/integrations/:service/test?tenantId=xxx */
  @Post(':service/test')
  @HttpCode(HttpStatus.OK)
  async test(
    @Param('service') service: string,
    @Query('tenantId') tenantId: string,
  ) {
    await this.service.markTested(tenantId, service);
    return { message: `Integration ${service} marked as tested`, testedAt: new Date() };
  }

  /** DELETE /itsm/integrations/:service?tenantId=xxx */
  @Delete(':service')
  @HttpCode(HttpStatus.OK)
  async disable(
    @Param('service') service: string,
    @Query('tenantId') tenantId: string,
  ) {
    await this.service.disable(tenantId, service);
    return { message: `Integration ${service} disabled for tenant ${tenantId}` };
  }
}
