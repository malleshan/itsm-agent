import { ConfigService } from '@nestjs/config';
export declare class GoogleAdapter {
    private readonly config;
    private readonly logger;
    constructor(config: ConfigService);
    createUser(email: string, password: string): Promise<void>;
    suspendUser(email: string): Promise<void>;
    deleteUser(email: string): Promise<void>;
}
