import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus,
  Param, Post, Put, Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { ItsmIntegrationsService } from './itsm-integrations.service';
import { UpsertIntegrationDto } from './dto/upsert-integration.dto';

@ApiTags('ITSM Integrations')
@ApiBearerAuth()
@Controller('itsm/integrations')
export class ItsmIntegrationsController {
  constructor(private readonly service: ItsmIntegrationsService) {}

  @Get()
  @ApiOperation({ summary: 'List all integrations for a tenant' })
  @ApiQuery({ name: 'tenantId', required: true, description: 'Tenant identifier' })
  @ApiResponse({ status: 200, description: 'Integration list with total count' })
  async list(@Query('tenantId') tenantId: string) {
    const data = await this.service.findAllByTenant(tenantId);
    return { data, total: data.length };
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get integration health metrics for a tenant' })
  @ApiQuery({ name: 'tenantId', required: true })
  @ApiResponse({ status: 200, description: 'Metrics: total, enabled, disabled, error counts' })
  async metrics(@Query('tenantId') tenantId: string) {
    return this.service.getMetrics(tenantId);
  }

  @Get(':service')
  @ApiOperation({ summary: 'Get a single integration by service name' })
  @ApiParam({ name: 'service', description: 'e.g. github, slack, zoho, jira' })
  @ApiQuery({ name: 'tenantId', required: true })
  @ApiResponse({ status: 200, description: 'Integration record' })
  @ApiResponse({ status: 404, description: 'Integration not found' })
  async findOne(
    @Param('service') service: string,
    @Query('tenantId') tenantId: string,
  ) {
    return this.service.findOne(tenantId, service);
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create or update a service integration (upsert)' })
  @ApiResponse({ status: 200, description: 'Integration saved' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async upsert(@Body() dto: UpsertIntegrationDto) {
    const data = await this.service.upsert(dto);
    return { data, message: `Integration ${dto.service} configured for tenant ${dto.tenantId}` };
  }

  @Post(':service/test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark an integration as tested' })
  @ApiParam({ name: 'service', description: 'Service name' })
  @ApiQuery({ name: 'tenantId', required: true })
  @ApiResponse({ status: 200, description: 'Integration marked as tested' })
  async test(
    @Param('service') service: string,
    @Query('tenantId') tenantId: string,
  ) {
    await this.service.markTested(tenantId, service);
    return { message: `Integration ${service} marked as tested`, testedAt: new Date() };
  }

  @Delete(':service')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Disable (soft-delete) an integration' })
  @ApiParam({ name: 'service', description: 'Service name' })
  @ApiQuery({ name: 'tenantId', required: true })
  @ApiResponse({ status: 200, description: 'Integration disabled' })
  async disable(
    @Param('service') service: string,
    @Query('tenantId') tenantId: string,
  ) {
    await this.service.disable(tenantId, service);
    return { message: `Integration ${service} disabled for tenant ${tenantId}` };
  }
}
