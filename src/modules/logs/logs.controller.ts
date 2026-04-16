import { Controller, Get, Param } from '@nestjs/common';
import { LogsService } from './logs.service';

@Controller('logs')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  /**
   * GET /logs/:email
   * Retrieve all provisioning/de-provisioning audit logs for an employee.
   */
  @Get(':email')
  async findByEmail(@Param('email') email: string) {
    const logs = await this.logsService.findByEmail(email);
    return { email, logs };
  }

  /**
   * GET /logs/employee/:id
   * Retrieve all logs for an employee by their internal ID.
   */
  @Get('employee/:id')
  async findByEmployeeId(@Param('id') id: string) {
    const logs = await this.logsService.findByEmployeeId(id);
    return { employeeId: id, logs };
  }
}
