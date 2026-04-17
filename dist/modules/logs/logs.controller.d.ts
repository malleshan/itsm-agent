import { LogsService } from './logs.service';
export declare class LogsController {
    private readonly logsService;
    constructor(logsService: LogsService);
    findByEmployeeId(id: string): Promise<{
        employeeId: string;
        total: number;
        logs: import("./schemas/log.schema").LogDocument[];
    }>;
    findByTenant(tenantId: string): Promise<{
        tenantId: string;
        total: number;
        logs: import("./schemas/log.schema").LogDocument[];
    }>;
    findByEmail(email: string): Promise<{
        email: string;
        total: number;
        logs: import("./schemas/log.schema").LogDocument[];
    }>;
}
