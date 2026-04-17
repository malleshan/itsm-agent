import { ConfigService } from '@nestjs/config';
import { AdapterCredentials, IAdapter } from '../common/interfaces/adapter.interface';
export declare class GoogleAdapter implements IAdapter {
    private readonly config;
    private readonly logger;
    constructor(config: ConfigService);
    private resolveToken;
    inviteUser(email: string, credentials?: AdapterCredentials, password?: string): Promise<void>;
    removeUser(email: string, credentials?: AdapterCredentials): Promise<void>;
    assignRoleOrAccess(email: string, role: string, credentials?: AdapterCredentials): Promise<void>;
}
