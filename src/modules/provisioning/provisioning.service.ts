import { Injectable, Logger } from '@nestjs/common';
import { GithubAdapter } from '../../adapters/github.adapter';
import { SlackAdapter } from '../../adapters/slack.adapter';
import { GoogleAdapter } from '../../adapters/google.adapter';
import { JiraAdapter } from '../../adapters/jira.adapter';
import { SalesforceAdapter } from '../../adapters/salesforce.adapter';
import { Microsoft365Adapter } from '../../adapters/microsoft365.adapter';
import { ZoomAdapter } from '../../adapters/zoom.adapter';
import { ServiceNowAdapter } from '../../adapters/servicenow.adapter';
import { SapAdapter } from '../../adapters/sap.adapter';
import { LogsService, CreateLogDto } from '../logs/logs.service';
import { LogStatus, LogAction } from '../logs/schemas/log.schema';
import { ItsmIntegrationsService } from '../itsm/itsm-integrations.service';
import { AiRecommendationService, ALL_TOOLS } from '../ai-recommendation/ai-recommendation.service';
import { EmailService } from '../email/email.service';
import { AdapterCredentials } from '../../common/interfaces/adapter.interface';
import { EmployeeEvent } from '../../kafka/kafka.producer.service';
import { generatePassword } from '../../utils/password';

@Injectable()
export class ProvisioningService {
  private readonly logger = new Logger(ProvisioningService.name);

  constructor(
    private readonly logsService: LogsService,
    private readonly itsmIntegrations: ItsmIntegrationsService,
    private readonly aiRecommendation: AiRecommendationService,
    private readonly emailService: EmailService,
    private readonly github: GithubAdapter,
    private readonly slack: SlackAdapter,
    private readonly google: GoogleAdapter,
    private readonly jira: JiraAdapter,
    private readonly salesforce: SalesforceAdapter,
    private readonly microsoft365: Microsoft365Adapter,
    private readonly zoom: ZoomAdapter,
    private readonly servicenow: ServiceNowAdapter,
    private readonly sap: SapAdapter,
  ) {}

  // ── Public API ─────────────────────────────────────────────────────────────

  async provisionEmployee(event: EmployeeEvent): Promise<void> {
    const { employeeId, tenantId, firstName, lastName, email, role, department } = event;
    const password = generatePassword();

    // 1. Get tenant-enabled tools (from itsm_integrations, cached in Redis)
    const enabledTools = await this.itsmIntegrations.getEnabledTools(tenantId)
      .then((tools) => (tools.length > 0 ? tools : ALL_TOOLS));

    // 2. AI recommendation with fallback to deterministic rules
    const tools = await this.aiRecommendation.recommendTools({
      role, department, firstName, enabledTools,
    });

    const credentials = await this.itsmIntegrations.getCredentials(tenantId);

    this.logger.log(
      `[PROVISION] ${firstName} ${lastName} | role: ${role} | email: ${email} | tools: [${tools.join(', ')}]`,
    );

    // 3. Execute all adapters concurrently, isolating failures
    const results = await Promise.allSettled(
      tools.map((tool) =>
        this.runProvisioning({ employeeId, tenantId, email, tool, role, credentials, password }),
      ),
    );

    const succeeded = tools.filter((_, i) => results[i].status === 'fulfilled');
    const failed = tools.filter((_, i) => results[i].status === 'rejected');
    if (failed.length) this.logger.warn(`Failed tools: [${failed.join(', ')}] for ${email}`);

    // 4. Send welcome email with credentials
    if (succeeded.length > 0) {
      await this.emailService
        .sendOnboardingEmail({ to: email, firstName, password, tools: succeeded, tenantId })
        .catch((e: Error) => this.logger.error(`Onboarding email failed: ${e.message}`));
    }
  }

  async deprovisionEmployee(event: EmployeeEvent): Promise<void> {
    const { employeeId, tenantId, firstName, email, role, department } = event;

    const enabledTools = await this.itsmIntegrations.getEnabledTools(tenantId)
      .then((tools) => (tools.length > 0 ? tools : ALL_TOOLS));

    const tools = await this.aiRecommendation.recommendTools({
      role, department, firstName, enabledTools,
    });

    const credentials = await this.itsmIntegrations.getCredentials(tenantId);

    this.logger.log(
      `[DEPROVISION] ${firstName} | role: ${role} | email: ${email} | tools: [${tools.join(', ')}]`,
    );

    const results = await Promise.allSettled(
      tools.map((tool) =>
        this.runDeprovisioning({ employeeId, tenantId, email, tool, credentials }),
      ),
    );

    const succeeded = tools.filter((_, i) => results[i].status === 'fulfilled');
    const failed = tools.filter((_, i) => results[i].status === 'rejected');
    if (failed.length) this.logger.warn(`Deprovision failed tools: [${failed.join(', ')}] for ${email}`);

    if (succeeded.length > 0) {
      await this.emailService
        .sendOffboardingEmail({ to: email, firstName, tools: succeeded })
        .catch((e: Error) => this.logger.error(`Offboarding email failed: ${e.message}`));
    }
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private async runProvisioning(p: {
    employeeId: string; tenantId: string; email: string;
    tool: string; role: string; credentials: AdapterCredentials; password: string;
  }): Promise<void> {
    const base: Omit<CreateLogDto, 'status' | 'message'> = {
      employeeId: p.employeeId, tenantId: p.tenantId,
      email: p.email, tool: p.tool, action: LogAction.PROVISION,
    };
    try {
      await this.invoke(p.tool, 'provision', p.email, p.role, p.credentials, p.password);
      await this.logsService.create({ ...base, status: LogStatus.SUCCESS, message: `${p.tool} provisioned successfully` });
      this.logger.log(`  ✓ ${p.tool} → ${p.email}`);
    } catch (err: any) {
      await this.logsService.create({ ...base, status: LogStatus.FAILED, message: err?.message ?? `${p.tool} failed` });
      await this.itsmIntegrations.markError(p.tenantId, p.tool, err?.message ?? 'Unknown error').catch(() => {});
      this.logger.error(`  ✗ ${p.tool} → ${p.email}: ${err?.message}`);
      throw err;
    }
  }

  private async runDeprovisioning(p: {
    employeeId: string; tenantId: string; email: string;
    tool: string; credentials: AdapterCredentials;
  }): Promise<void> {
    const base: Omit<CreateLogDto, 'status' | 'message'> = {
      employeeId: p.employeeId, tenantId: p.tenantId,
      email: p.email, tool: p.tool, action: LogAction.DEPROVISION,
    };
    try {
      await this.invoke(p.tool, 'deprovision', p.email, undefined, p.credentials);
      await this.logsService.create({ ...base, status: LogStatus.SUCCESS, message: `${p.tool} de-provisioned successfully` });
      this.logger.log(`  ✓ ${p.tool} removed for ${p.email}`);
    } catch (err: any) {
      await this.logsService.create({ ...base, status: LogStatus.FAILED, message: err?.message ?? `${p.tool} failed` });
      this.logger.error(`  ✗ ${p.tool} remove failed for ${p.email}: ${err?.message}`);
      throw err;
    }
  }

  private async invoke(
    tool: string, action: 'provision' | 'deprovision',
    email: string, role?: string,
    credentials?: AdapterCredentials, password?: string,
  ): Promise<void> {
    const p = action === 'provision';
    switch (tool) {
      case 'github':       return p ? this.github.inviteUser(email, credentials) : this.github.removeUser(email, credentials);
      case 'slack':        return p ? this.slack.inviteUser(email, credentials) : this.slack.removeUser(email, credentials);
      case 'google':       return p ? this.google.inviteUser(email, credentials, password) : this.google.removeUser(email, credentials);
      case 'jira':         return p ? this.jira.inviteUser(email, credentials) : this.jira.removeUser(email, credentials);
      case 'salesforce':   return p ? this.salesforce.inviteUser(email, credentials) : this.salesforce.removeUser(email, credentials);
      case 'microsoft365': return p ? this.microsoft365.inviteUser(email, credentials, password) : this.microsoft365.removeUser(email, credentials);
      case 'zoom':         return p ? this.zoom.inviteUser(email, credentials) : this.zoom.removeUser(email, credentials);
      case 'servicenow':   return p ? this.servicenow.inviteUser(email, credentials) : this.servicenow.removeUser(email, credentials);
      case 'sap':          return p ? this.sap.inviteUser(email, credentials) : this.sap.removeUser(email, credentials);
      default: this.logger.warn(`Unknown tool "${tool}" — skipping`);
    }
  }
}
