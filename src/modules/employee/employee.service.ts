import { ConflictException, forwardRef, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { Employee, EmployeeDocument, EmployeeStatus } from './schemas/employee.schema';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { KafkaProducerService } from '../../kafka/kafka.producer.service';
import { ProvisioningService } from '../provisioning/provisioning.service';
import { generateBaseEmail } from '../../utils/helpers';

@Injectable()
export class EmployeeService {
  private readonly logger = new Logger(EmployeeService.name);

  constructor(
    @InjectModel(Employee.name)
    private readonly employeeModel: Model<EmployeeDocument>,
    private readonly kafkaProducer: KafkaProducerService,
    @Inject(forwardRef(() => ProvisioningService))
    private readonly provisioningService: ProvisioningService,
    private readonly config: ConfigService,
  ) {}

  async create(dto: CreateEmployeeDto): Promise<EmployeeDocument> {
    const domain = this.config.get<string>('company.emailDomain') || 'terralogic.com';
    const email = await this.generateUniqueEmail(dto.firstName, dto.lastName, domain);

    const employee = await this.employeeModel.create({
      ...dto,
      name: `${dto.firstName} ${dto.lastName}`,
      email,
    });

    this.logger.log(`Employee created: ${employee.email} (id: ${employee._id})`);

    const event = {
      employeeId: String(employee._id),
      tenantId: employee.tenantId,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      role: employee.role,
      department: employee.department,
    };

    const kafkaEnabled = this.config.get<string>('kafka.enabled') !== 'false' &&
      process.env.KAFKA_ENABLED !== 'false';

    if (kafkaEnabled) {
      await this.kafkaProducer.publishOnboarded(event);
    } else {
      // Kafka disabled — provision directly in-process
      this.logger.log(`Kafka disabled — triggering provisioning directly for ${email}`);
      this.provisioningService.provisionEmployee(event).catch((err: Error) =>
        this.logger.error(`Direct provisioning failed for ${email}: ${err.message}`),
      );
    }

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

  async offboard(id: string): Promise<EmployeeDocument> {
    const employee = await this.findById(id);
    employee.status = EmployeeStatus.OFFBOARDED;
    await employee.save();
    this.logger.log(`Employee offboarded: ${employee.email}`);

    const event = {
      employeeId: String(employee._id),
      tenantId: employee.tenantId,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      role: employee.role,
      department: employee.department,
    };

    const kafkaEnabled = process.env.KAFKA_ENABLED !== 'false';

    if (kafkaEnabled) {
      await this.kafkaProducer.publishOffboarded(event);
    } else {
      this.logger.log(`Kafka disabled — triggering de-provisioning directly for ${employee.email}`);
      this.provisioningService.deprovisionEmployee(event).catch((err: Error) =>
        this.logger.error(`Direct de-provisioning failed for ${employee.email}: ${err.message}`),
      );
    }

    return employee;
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private async generateUniqueEmail(firstName: string, lastName: string, domain: string): Promise<string> {
    // Try clean base first: firstname.lastname@domain
    const base = generateBaseEmail(firstName, lastName, domain);
    const baseExists = await this.employeeModel.exists({ email: base });
    if (!baseExists) return base;

    // Collision — try with 3-digit random suffix up to 10 times
    for (let i = 0; i < 10; i++) {
      const suffix = Math.floor(100 + Math.random() * 900);
      const candidate = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${suffix}@${domain}`;
      const exists = await this.employeeModel.exists({ email: candidate });
      if (!exists) return candidate;
    }

    throw new ConflictException(
      `Could not generate a unique email for ${firstName} ${lastName}. Please try again.`,
    );
  }
}
