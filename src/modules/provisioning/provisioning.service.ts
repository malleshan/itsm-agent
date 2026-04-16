import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GithubAdapter } from '../../adapters/github.adapter';
import { SlackAdapter } from '../../adapters/slack.adapter';
import { GoogleAdapter } from '../../adapters/google.adapter';
import { LogsService, CreateLogDto } from '../logs/logs.service';
import { LogStatus } from '../logs/schemas/log.schema';
import { generateCompanyEmail } from '../../utils/helpers';
import { generatePassword } from '../../utils/password';
import { EmployeeEvent } from '../../kafka/kafka.producer.service';

/**
 * Role → tools mapping.
 * Extend this map to support more roles and tools.
 */
const ROLE_ACCESS: Record<string, string[]> = {
  developer: ['github', 'slack', 'google'],
  hr: ['slack', 'google'],
  manager: ['slack', 'google'],
  default: ['slack'],
};

@Injectable()
export class ProvisioningService {
  private readonly logger = new Logger(ProvisioningService.name);

  constructor(
    private readonly logsService: LogsService,
    private readonly config: ConfigService,
    private readonly githubAdapter: GithubAdapter,
    private readonly slackAdapter: SlackAdapter,
    private readonly googleAdapter: GoogleAdapter,
  ) {}

  /**
   * Provisions a new employee across all tools assigned to their role.
   * Called when the Kafka consumer receives an `itsm.employee.onboarded` event.
   */
  async provisionEmployee(event: EmployeeEvent): Promise<void> {
    const companyEmail = generateCompanyEmail(
      event.name,
      this.config.get<string>('company.emailDomain'),
    );
    const password = generatePassword();
    const tools = ROLE_ACCESS[event.role.toLowerCase()] || ROLE_ACCESS.default;

    this.logger.log(
      `Provisioning [${event.role}] ${event.name} → email: ${companyEmail}, tools: ${tools.join(', ')}`,
    );

    await Promise.all(
      tools.map((tool) => this.runProvisioning(event, tool, companyEmail, password)),
    );
  }

  /**
   * De-provisions an employee from all tools.
   * Called when the Kafka consumer receives an `itsm.employee.offboarded` event.
   */
  async deprovisionEmployee(event: EmployeeEvent): Promise<void> {
    const tools = ROLE_ACCESS[event.role.toLowerCase()] || ROLE_ACCESS.default;

    this.logger.log(
      `De-provisioning [${event.role}] ${event.name} from tools: ${tools.join(', ')}`,
    );

    await Promise.all(
      tools.map((tool) => this.runDeprovisioning(event, tool)),
    );
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async runProvisioning(
    event: EmployeeEvent,
    tool: string,
    companyEmail: string,
    password: string,
  ): Promise<void> {
    const logBase: Omit<CreateLogDto, 'status' | 'message'> = {
      employeeId: event.employeeId,
      email: companyEmail,
      tool,
    };

    try {
      switch (tool) {
        case 'github':
          await this.githubAdapter.inviteUser(companyEmail);
          break;
        case 'slack':
          await this.slackAdapter.createUser(companyEmail);
          break;
        case 'google':
          await this.googleAdapter.createUser(companyEmail, password);
          break;
        default:
          this.logger.warn(`Unknown tool: ${tool}`);
          return;
      }

      await this.logsService.create({
        ...logBase,
        status: LogStatus.SUCCESS,
        message: `${tool} provisioned successfully`,
      });

      this.logger.log(`✓ ${tool} provisioned for ${companyEmail}`);
    } catch (err: any) {
      await this.logsService.create({
        ...logBase,
        status: LogStatus.FAILED,
        message: err.message || `${tool} provisioning failed`,
      });

      this.logger.error(`✗ ${tool} provisioning failed for ${companyEmail}: ${err.message}`);
    }
  }

  private async runDeprovisioning(event: EmployeeEvent, tool: string): Promise<void> {
    const logBase: Omit<CreateLogDto, 'status' | 'message'> = {
      employeeId: event.employeeId,
      email: event.email,
      tool,
    };

    try {
      switch (tool) {
        case 'github':
          await this.githubAdapter.removeUser(event.email);
          break;
        case 'slack':
          await this.slackAdapter.deactivateUser(event.email);
          break;
        case 'google':
          await this.googleAdapter.suspendUser(event.email);
          break;
        default:
          this.logger.warn(`Unknown tool for de-provisioning: ${tool}`);
          return;
      }

      await this.logsService.create({
        ...logBase,
        status: LogStatus.SUCCESS,
        message: `${tool} de-provisioned successfully`,
      });

      this.logger.log(`✓ ${tool} de-provisioned for ${event.email}`);
    } catch (err: any) {
      await this.logsService.create({
        ...logBase,
        status: LogStatus.FAILED,
        message: err.message || `${tool} de-provisioning failed`,
      });

      this.logger.error(`✗ ${tool} de-provisioning failed for ${event.email}: ${err.message}`);
    }
  }
}
