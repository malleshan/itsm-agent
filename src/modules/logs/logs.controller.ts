import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { LogsService } from './logs.service';

/**
 * Route ordering matters: static segments (/employee/:id, /tenant/:tenantId)
 * MUST be declared before the catch-all (/:email) or the catch-all wins.
 */
@ApiTags('Audit Logs')
@ApiBearerAuth()
@Controller('logs')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get('employee/:id')
  @ApiOperation({ summary: 'Get audit logs by employee ID' })
  @ApiParam({ name: 'id', description: 'Employee MongoDB ObjectId' })
  @ApiResponse({ status: 200, description: 'Audit log entries for the employee' })
  async findByEmployeeId(@Param('id') id: string) {
    const logs = await this.logsService.findByEmployeeId(id);
    return { employeeId: id, total: logs.length, logs };
  }

  @Get('tenant/:tenantId')
  @ApiOperation({ summary: 'Get all audit logs for a tenant' })
  @ApiParam({ name: 'tenantId', description: 'Tenant identifier' })
  @ApiResponse({ status: 200, description: 'Audit log entries for the tenant' })
  async findByTenant(@Param('tenantId') tenantId: string) {
    const logs = await this.logsService.findByTenantId(tenantId);
    return { tenantId, total: logs.length, logs };
  }

  @Get(':email')
  @ApiOperation({ summary: 'Get audit logs by employee email' })
  @ApiParam({ name: 'email', description: 'Employee email address' })
  @ApiResponse({ status: 200, description: 'Audit log entries for the email' })
  async findByEmail(@Param('email') email: string) {
    const logs = await this.logsService.findByEmail(email);
    return { email, total: logs.length, logs };
  }
}
