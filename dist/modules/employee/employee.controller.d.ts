import { EmployeeService } from './employee.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
export declare class EmployeeController {
    private readonly employeeService;
    private readonly logger;
    constructor(employeeService: EmployeeService);
    create(dto: CreateEmployeeDto): Promise<{
        id: import("mongoose").Types.ObjectId;
        name: string;
        email: string;
        role: string;
        status: import("./schemas/employee.schema").EmployeeStatus;
        createdAt: any;
    }>;
    findAll(): Promise<import("./schemas/employee.schema").EmployeeDocument[]>;
    findOne(id: string): Promise<import("./schemas/employee.schema").EmployeeDocument>;
    offboard(id: string): Promise<{
        id: import("mongoose").Types.ObjectId;
        name: string;
        email: string;
        status: import("./schemas/employee.schema").EmployeeStatus;
        message: string;
    }>;
}
