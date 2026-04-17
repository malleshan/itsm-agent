import { ConfigService } from '@nestjs/config';
export declare class SlackAdapter {
    private readonly config;
    private readonly logger;
    constructor(config: ConfigService);
    private get headers();
    createUser(email: string): Promise<void>;
    deactivateUser(email: string): Promise<void>;
}
