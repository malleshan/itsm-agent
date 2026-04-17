import { Model } from 'mongoose';
import { LogDocument, LogStatus } from './schemas/log.schema';
export interface CreateLogDto {
    employeeId: string;
    email: string;
    tool: string;
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
}
