import { ConfigService } from '@nestjs/config';
import { GithubAdapter } from '../../adapters/github.adapter';
import { SlackAdapter } from '../../adapters/slack.adapter';
import { GoogleAdapter } from '../../adapters/google.adapter';
import { LogsService } from '../logs/logs.service';
import { EmployeeEvent } from '../../kafka/kafka.producer.service';
export declare class ProvisioningService {
    private readonly logsService;
    private readonly config;
    private readonly githubAdapter;
    private readonly slackAdapter;
    private readonly googleAdapter;
    private readonly logger;
    constructor(logsService: LogsService, config: ConfigService, githubAdapter: GithubAdapter, slackAdapter: SlackAdapter, googleAdapter: GoogleAdapter);
    provisionEmployee(event: EmployeeEvent): Promise<void>;
    deprovisionEmployee(event: EmployeeEvent): Promise<void>;
    private runProvisioning;
    private runDeprovisioning;
}
