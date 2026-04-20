import { Body, Controller, Get, Param, Put, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { TenantConfigService } from './tenant-config.service';
import { UpsertTenantConfigDto } from './dto/upsert-tenant-config.dto';

@ApiTags('Tenant Config')
@ApiBearerAuth()
@Controller('tenant-config')
export class TenantConfigController {
  constructor(private readonly tenantConfigService: TenantConfigService) {}

  @Put()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create or update tenant configuration' })
  @ApiResponse({ status: 200, description: 'Tenant config saved' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async upsert(@Body() dto: UpsertTenantConfigDto) {
    return this.tenantConfigService.upsert(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all tenant configurations' })
  @ApiResponse({ status: 200, description: 'All tenant configs' })
  async findAll() {
    return this.tenantConfigService.findAll();
  }

  @Get(':tenantId')
  @ApiOperation({ summary: 'Get configuration for a specific tenant' })
  @ApiParam({ name: 'tenantId', description: 'Tenant identifier' })
  @ApiResponse({ status: 200, description: 'Tenant config' })
  @ApiResponse({ status: 404, description: 'Tenant config not found' })
  async findOne(@Param('tenantId') tenantId: string) {
    return this.tenantConfigService.getOrFail(tenantId);
  }
}
