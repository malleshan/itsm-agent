import { ConfigService } from '@nestjs/config';
export declare class GithubAdapter {
    private readonly config;
    private readonly logger;
    constructor(config: ConfigService);
    private get org();
    private get headers();
    inviteUser(email: string): Promise<void>;
    removeUser(email: string): Promise<void>;
}
