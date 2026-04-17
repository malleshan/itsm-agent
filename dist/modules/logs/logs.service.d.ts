import { Model } from 'mongoose';
import { LogDocument, LogAction, LogStatus } from './schemas/log.schema';
export interface CreateLogDto {
    employeeId: string;
    tenantId: string;
    email: string;
    tool: string;
    action: LogAction;
    status: LogStatus;
    message: string;
}
export declare class LogsService {
    private readonly logModel;
    private readonly logger;
    constructor(logModel: Model<LogDocument>);
    create(dto: CreateLogDto): Promise<LogDocument>;
    findByEmail(email: string): Promise<LogDocument[]>;
    findByEmployeeId(employeeId: string): Promise<LogDocument[]>;
    findByTenantId(tenantId: string): Promise<LogDocument[]>;
}
