import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Employee, EmployeeDocument, EmployeeStatus } from './schemas/employee.schema';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { KafkaProducerService } from '../../kafka/kafka.producer.service';

@Injectable()
export class EmployeeService {
  private readonly logger = new Logger(EmployeeService.name);

  constructor(
    @InjectModel(Employee.name)
    private readonly employeeModel: Model<EmployeeDocument>,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  /**
   * Creates a new employee record and publishes an onboarding event to Kafka.
   * The provisioning service consumes that event and provisions the employee
   * in all relevant third-party tools (GitHub, Slack, Google Workspace, etc.).
   */
  async create(dto: CreateEmployeeDto): Promise<EmployeeDocument> {
    const employee = await this.employeeModel.create(dto);
    this.logger.log(`Employee created: ${employee.email} (id: ${employee._id})`);

    await this.kafkaProducer.publishOnboarded({
      employeeId: String(employee._id),
      tenantId: employee.tenantId,
      name: employee.name,
      email: employee.email,
      role: employee.role,
      department: employee.department,
    });

    return employee;
  }

  async findAll(): Promise<EmployeeDocument[]> {
    return this.employeeModel.find().exec();
  }

  async findById(id: string): Promise<EmployeeDocument> {
    const employee = await this.employeeModel.findById(id).exec();
    if (!employee) throw new NotFoundException(`Employee ${id} not found`);
    return employee;
  }

  /**
   * Marks the employee as OFFBOARDED and publishes an offboarding event to Kafka.
   * The provisioning service consumes that event and removes the employee from
   * all provisioned third-party tools.
   */
  async offboard(id: string): Promise<EmployeeDocument> {
    const employee = await this.findById(id);

    employee.status = EmployeeStatus.OFFBOARDED;
    await employee.save();
    this.logger.log(`Employee offboarded: ${employee.email}`);

    await this.kafkaProducer.publishOffboarded({
      employeeId: String(employee._id),
      tenantId: employee.tenantId,
      name: employee.name,
      email: employee.email,
      role: employee.role,
    });

    return employee;
  }
}
