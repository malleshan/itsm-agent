import { ConfigService } from '@nestjs/config';
import { AdapterCredentials, IAdapter } from '../common/interfaces/adapter.interface';
export declare class GithubAdapter implements IAdapter {
    private readonly config;
    private readonly logger;
    constructor(config: ConfigService);
    private org;
    private headers;
    inviteUser(email: string, credentials?: AdapterCredentials): Promise<void>;
    removeUser(email: string, credentials?: AdapterCredentials): Promise<void>;
    assignRoleOrAccess(email: string, role: string, _credentials?: AdapterCredentials): Promise<void>;
}
