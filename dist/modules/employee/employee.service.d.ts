import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { EmployeeDocument } from './schemas/employee.schema';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { KafkaProducerService } from '../../kafka/kafka.producer.service';
import { ProvisioningService } from '../provisioning/provisioning.service';
export declare class EmployeeService {
    private readonly employeeModel;
    private readonly kafkaProducer;
    private readonly provisioningService;
    private readonly config;
    private readonly logger;
    constructor(employeeModel: Model<EmployeeDocument>, kafkaProducer: KafkaProducerService, provisioningService: ProvisioningService, config: ConfigService);
    create(dto: CreateEmployeeDto): Promise<EmployeeDocument>;
    findAll(): Promise<EmployeeDocument[]>;
    findById(id: string): Promise<EmployeeDocument>;
    offboard(id: string): Promise<EmployeeDocument>;
    private generateUniqueEmail;
}
