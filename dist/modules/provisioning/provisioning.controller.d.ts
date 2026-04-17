import { KafkaContext } from '@nestjs/microservices';
import { ProvisioningService } from './provisioning.service';
export declare class ProvisioningController {
    private readonly provisioningService;
    private readonly logger;
    constructor(provisioningService: ProvisioningService);
    handleEmployeeOnboarded(message: any, context: KafkaContext): Promise<void>;
    handleEmployeeOffboarded(message: any, context: KafkaContext): Promise<void>;
    private parsePayload;
}
