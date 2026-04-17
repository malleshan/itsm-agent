import { KafkaContext } from '@nestjs/microservices';
import { ProvisioningService } from './provisioning.service';
declare class TriggerProvisionDto {
    employeeId: string;
    tenantId: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    department?: string;
}
export declare class ProvisioningController {
    private readonly provisioningService;
    private readonly logger;
    constructor(provisioningService: ProvisioningService);
    triggerProvision(dto: TriggerProvisionDto): Promise<{
        message: string;
        email: string;
        role: string;
    }>;
    triggerDeprovision(dto: TriggerProvisionDto): Promise<{
        message: string;
        email: string;
    }>;
    handleEmployeeOnboarded(message: any, context: KafkaContext): Promise<void>;
    handleEmployeeOffboarded(message: any, context: KafkaContext): Promise<void>;
    private parsePayload;
}
export {};
