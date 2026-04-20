import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { EmployeeService } from './employee.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';

@ApiTags('Employees')
@ApiBearerAuth()
@Controller('employees')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Onboard a new employee and trigger provisioning' })
  @ApiResponse({ status: 201, description: 'Employee created and provisioning triggered' })
  @ApiResponse({ status: 400, description: 'Validation error' })
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

  @Get()
  @ApiOperation({ summary: 'List all employees' })
  @ApiResponse({ status: 200, description: 'Employee list' })
  async findAll() {
    return this.employeeService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get employee by ID' })
  @ApiParam({ name: 'id', description: 'Employee MongoDB ObjectId' })
  @ApiResponse({ status: 200, description: 'Employee record' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async findOne(@Param('id') id: string) {
    return this.employeeService.findById(id);
  }

  @Patch(':id/offboard')
  @ApiOperation({ summary: 'Offboard employee and trigger de-provisioning' })
  @ApiParam({ name: 'id', description: 'Employee MongoDB ObjectId' })
  @ApiResponse({ status: 200, description: 'Employee offboarded, de-provisioning in progress' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
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
