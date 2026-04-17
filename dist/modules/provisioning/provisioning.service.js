"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ProvisioningService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProvisioningService = void 0;
const common_1 = require("@nestjs/common");
const github_adapter_1 = require("../../adapters/github.adapter");
const slack_adapter_1 = require("../../adapters/slack.adapter");
const google_adapter_1 = require("../../adapters/google.adapter");
const jira_adapter_1 = require("../../adapters/jira.adapter");
const salesforce_adapter_1 = require("../../adapters/salesforce.adapter");
const microsoft365_adapter_1 = require("../../adapters/microsoft365.adapter");
const zoom_adapter_1 = require("../../adapters/zoom.adapter");
const servicenow_adapter_1 = require("../../adapters/servicenow.adapter");
const sap_adapter_1 = require("../../adapters/sap.adapter");
const logs_service_1 = require("../logs/logs.service");
const log_schema_1 = require("../logs/schemas/log.schema");
const itsm_integrations_service_1 = require("../itsm/itsm-integrations.service");
const ai_recommendation_service_1 = require("../ai-recommendation/ai-recommendation.service");
const email_service_1 = require("../email/email.service");
const password_1 = require("../../utils/password");
let ProvisioningService = ProvisioningService_1 = class ProvisioningService {
    constructor(logsService, itsmIntegrations, aiRecommendation, emailService, github, slack, google, jira, salesforce, microsoft365, zoom, servicenow, sap) {
        this.logsService = logsService;
        this.itsmIntegrations = itsmIntegrations;
        this.aiRecommendation = aiRecommendation;
        this.emailService = emailService;
        this.github = github;
        this.slack = slack;
        this.google = google;
        this.jira = jira;
        this.salesforce = salesforce;
        this.microsoft365 = microsoft365;
        this.zoom = zoom;
        this.servicenow = servicenow;
        this.sap = sap;
        this.logger = new common_1.Logger(ProvisioningService_1.name);
    }
    async provisionEmployee(event) {
        const { employeeId, tenantId, firstName, lastName, email, role, department } = event;
        const password = (0, password_1.generatePassword)();
        const enabledTools = await this.itsmIntegrations.getEnabledTools(tenantId)
            .then((tools) => (tools.length > 0 ? tools : ai_recommendation_service_1.ALL_TOOLS));
        const tools = await this.aiRecommendation.recommendTools({
            role, department, firstName, enabledTools,
        });
        const credentials = await this.itsmIntegrations.getCredentials(tenantId);
        this.logger.log(`[PROVISION] ${firstName} ${lastName} | role: ${role} | email: ${email} | tools: [${tools.join(', ')}]`);
        const results = await Promise.allSettled(tools.map((tool) => this.runProvisioning({ employeeId, tenantId, email, tool, role, credentials, password })));
        const succeeded = tools.filter((_, i) => results[i].status === 'fulfilled');
        const failed = tools.filter((_, i) => results[i].status === 'rejected');
        if (failed.length)
            this.logger.warn(`Failed tools: [${failed.join(', ')}] for ${email}`);
        if (succeeded.length > 0) {
            await this.emailService
                .sendOnboardingEmail({ to: email, firstName, password, tools: succeeded, tenantId })
                .catch((e) => this.logger.error(`Onboarding email failed: ${e.message}`));
        }
    }
    async deprovisionEmployee(event) {
        const { employeeId, tenantId, firstName, email, role, department } = event;
        const enabledTools = await this.itsmIntegrations.getEnabledTools(tenantId)
            .then((tools) => (tools.length > 0 ? tools : ai_recommendation_service_1.ALL_TOOLS));
        const tools = await this.aiRecommendation.recommendTools({
            role, department, firstName, enabledTools,
        });
        const credentials = await this.itsmIntegrations.getCredentials(tenantId);
        this.logger.log(`[DEPROVISION] ${firstName} | role: ${role} | email: ${email} | tools: [${tools.join(', ')}]`);
        const results = await Promise.allSettled(tools.map((tool) => this.runDeprovisioning({ employeeId, tenantId, email, tool, credentials })));
        const succeeded = tools.filter((_, i) => results[i].status === 'fulfilled');
        const failed = tools.filter((_, i) => results[i].status === 'rejected');
        if (failed.length)
            this.logger.warn(`Deprovision failed tools: [${failed.join(', ')}] for ${email}`);
        if (succeeded.length > 0) {
            await this.emailService
                .sendOffboardingEmail({ to: email, firstName, tools: succeeded })
                .catch((e) => this.logger.error(`Offboarding email failed: ${e.message}`));
        }
    }
    async runProvisioning(p) {
        const base = {
            employeeId: p.employeeId, tenantId: p.tenantId,
            email: p.email, tool: p.tool, action: log_schema_1.LogAction.PROVISION,
        };
        try {
            await this.invoke(p.tool, 'provision', p.email, p.role, p.credentials, p.password);
            await this.logsService.create({ ...base, status: log_schema_1.LogStatus.SUCCESS, message: `${p.tool} provisioned successfully` });
            this.logger.log(`  ✓ ${p.tool} → ${p.email}`);
        }
        catch (err) {
            await this.logsService.create({ ...base, status: log_schema_1.LogStatus.FAILED, message: err?.message ?? `${p.tool} failed` });
            await this.itsmIntegrations.markError(p.tenantId, p.tool, err?.message ?? 'Unknown error').catch(() => { });
            this.logger.error(`  ✗ ${p.tool} → ${p.email}: ${err?.message}`);
            throw err;
        }
    }
    async runDeprovisioning(p) {
        const base = {
            employeeId: p.employeeId, tenantId: p.tenantId,
            email: p.email, tool: p.tool, action: log_schema_1.LogAction.DEPROVISION,
        };
        try {
            await this.invoke(p.tool, 'deprovision', p.email, undefined, p.credentials);
            await this.logsService.create({ ...base, status: log_schema_1.LogStatus.SUCCESS, message: `${p.tool} de-provisioned successfully` });
            this.logger.log(`  ✓ ${p.tool} removed for ${p.email}`);
        }
        catch (err) {
            await this.logsService.create({ ...base, status: log_schema_1.LogStatus.FAILED, message: err?.message ?? `${p.tool} failed` });
            this.logger.error(`  ✗ ${p.tool} remove failed for ${p.email}: ${err?.message}`);
            throw err;
        }
    }
    async invoke(tool, action, email, role, credentials, password) {
        const p = action === 'provision';
        switch (tool) {
            case 'github': return p ? this.github.inviteUser(email, credentials) : this.github.removeUser(email, credentials);
            case 'slack': return p ? this.slack.inviteUser(email, credentials) : this.slack.removeUser(email, credentials);
            case 'google': return p ? this.google.inviteUser(email, credentials, password) : this.google.removeUser(email, credentials);
            case 'jira': return p ? this.jira.inviteUser(email, credentials) : this.jira.removeUser(email, credentials);
            case 'salesforce': return p ? this.salesforce.inviteUser(email, credentials) : this.salesforce.removeUser(email, credentials);
            case 'microsoft365': return p ? this.microsoft365.inviteUser(email, credentials, password) : this.microsoft365.removeUser(email, credentials);
            case 'zoom': return p ? this.zoom.inviteUser(email, credentials) : this.zoom.removeUser(email, credentials);
            case 'servicenow': return p ? this.servicenow.inviteUser(email, credentials) : this.servicenow.removeUser(email, credentials);
            case 'sap': return p ? this.sap.inviteUser(email, credentials) : this.sap.removeUser(email, credentials);
            default: this.logger.warn(`Unknown tool "${tool}" — skipping`);
        }
    }
};
exports.ProvisioningService = ProvisioningService;
exports.ProvisioningService = ProvisioningService = ProvisioningService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [logs_service_1.LogsService,
        itsm_integrations_service_1.ItsmIntegrationsService,
        ai_recommendation_service_1.AiRecommendationService,
        email_service_1.EmailService,
        github_adapter_1.GithubAdapter,
        slack_adapter_1.SlackAdapter,
        google_adapter_1.GoogleAdapter,
        jira_adapter_1.JiraAdapter,
        salesforce_adapter_1.SalesforceAdapter,
        microsoft365_adapter_1.Microsoft365Adapter,
        zoom_adapter_1.ZoomAdapter,
        servicenow_adapter_1.ServiceNowAdapter,
        sap_adapter_1.SapAdapter])
], ProvisioningService);
//# sourceMappingURL=provisioning.service.js.map