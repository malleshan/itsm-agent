import { LogsService } from './logs.service';
export declare class LogsController {
    private readonly logsService;
    constructor(logsService: LogsService);
    findByEmail(email: string): Promise<{
        email: string;
        logs: import("./schemas/log.schema").LogDocument[];
    }>;
    findByEmployeeId(id: string): Promise<{
        employeeId: string;
        logs: import("./schemas/log.schema").LogDocument[];
    }>;
}
