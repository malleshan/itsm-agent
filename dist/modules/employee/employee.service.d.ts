import { Model } from 'mongoose';
import { EmployeeDocument } from './schemas/employee.schema';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { KafkaProducerService } from '../../kafka/kafka.producer.service';
export declare class EmployeeService {
    private readonly employeeModel;
    private readonly kafkaProducer;
    private readonly logger;
    constructor(employeeModel: Model<EmployeeDocument>, kafkaProducer: KafkaProducerService);
    create(dto: CreateEmployeeDto): Promise<EmployeeDocument>;
    findAll(): Promise<EmployeeDocument[]>;
    findById(id: string): Promise<EmployeeDocument>;
    private generateEmail;
    offboard(id: string): Promise<EmployeeDocument>;
}
