import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';

@Controller('employees')
export class EmployeeController {
  private readonly logger = new Logger(EmployeeController.name);

  constructor(private readonly employeeService: EmployeeService) {}

  /**
   * POST /employees
   * Onboard a new employee — creates the record and triggers provisioning via Kafka.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateEmployeeDto) {
    const employee = await this.employeeService.create(dto);
    return {
      id: employee._id,
      name: employee.name,
      email: employee.email,
      role: employee.role,
      status: employee.status,
      createdAt: (employee as any).createdAt,
    };
  }

  /**
   * GET /employees
   * List all employees.
   */
  @Get()
  async findAll() {
    return this.employeeService.findAll();
  }

  /**
   * GET /employees/:id
   * Retrieve a single employee by ID.
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.employeeService.findById(id);
  }

  /**
   * PATCH /employees/:id/offboard
   * Offboard an employee — marks them OFFBOARDED and triggers de-provisioning via Kafka.
   */
  @Patch(':id/offboard')
  async offboard(@Param('id') id: string) {
    const employee = await this.employeeService.offboard(id);
    return {
      id: employee._id,
      name: employee.name,
      email: employee.email,
      status: employee.status,
      message: 'Employee offboarded. De-provisioning in progress.',
    };
  }
}
