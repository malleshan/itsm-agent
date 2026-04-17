import { Controller, Get, Param } from '@nestjs/common';
import { LogsService } from './logs.service';

/**
 * Route ordering matters in NestJS:
 * Static path segments (/employee/:id, /tenant/:tenantId) MUST be declared
 * before parameterised catch-all routes (/:email) or the catch-all wins.
 */
@Controller('logs')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  /** GET /logs/employee/:id — audit trail by internal employee ID. */
  @Get('employee/:id')
  async findByEmployeeId(@Param('id') id: string) {
    const logs = await this.logsService.findByEmployeeId(id);
    return { employeeId: id, total: logs.length, logs };
  }

  /** GET /logs/tenant/:tenantId — all logs for a tenant. */
  @Get('tenant/:tenantId')
  async findByTenant(@Param('tenantId') tenantId: string) {
    const logs = await this.logsService.findByTenantId(tenantId);
    return { tenantId, total: logs.length, logs };
  }

  /** GET /logs/:email — audit trail by employee email. Must be declared last. */
  @Get(':email')
  async findByEmail(@Param('email') email: string) {
    const logs = await this.logsService.findByEmail(email);
    return { email, total: logs.length, logs };
  }
}
