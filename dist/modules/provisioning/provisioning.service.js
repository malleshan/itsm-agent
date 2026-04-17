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
const config_1 = require("@nestjs/config");
const github_adapter_1 = require("../../adapters/github.adapter");
const slack_adapter_1 = require("../../adapters/slack.adapter");
const google_adapter_1 = require("../../adapters/google.adapter");
const logs_service_1 = require("../logs/logs.service");
const log_schema_1 = require("../logs/schemas/log.schema");
const helpers_1 = require("../../utils/helpers");
const password_1 = require("../../utils/password");
const ROLE_ACCESS = {
    developer: ['github', 'slack', 'google'],
    hr: ['slack', 'google'],
    manager: ['slack', 'google'],
    default: ['slack'],
};
let ProvisioningService = ProvisioningService_1 = class ProvisioningService {
    constructor(logsService, config, githubAdapter, slackAdapter, googleAdapter) {
        this.logsService = logsService;
        this.config = config;
        this.githubAdapter = githubAdapter;
        this.slackAdapter = slackAdapter;
        this.googleAdapter = googleAdapter;
        this.logger = new common_1.Logger(ProvisioningService_1.name);
    }
    async provisionEmployee(event) {
        const companyEmail = (0, helpers_1.generateCompanyEmail)(event.name, this.config.get('company.emailDomain'));
        const password = (0, password_1.generatePassword)();
        const tools = ROLE_ACCESS[event.role.toLowerCase()] || ROLE_ACCESS.default;
        this.logger.log(`Provisioning [${event.role}] ${event.name} → email: ${companyEmail}, tools: ${tools.join(', ')}`);
        await Promise.all(tools.map((tool) => this.runProvisioning(event, tool, companyEmail, password)));
    }
    async deprovisionEmployee(event) {
        const tools = ROLE_ACCESS[event.role.toLowerCase()] || ROLE_ACCESS.default;
        this.logger.log(`De-provisioning [${event.role}] ${event.name} from tools: ${tools.join(', ')}`);
        await Promise.all(tools.map((tool) => this.runDeprovisioning(event, tool)));
    }
    async runProvisioning(event, tool, companyEmail, password) {
        const logBase = {
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
                status: log_schema_1.LogStatus.SUCCESS,
                message: `${tool} provisioned successfully`,
            });
            this.logger.log(`✓ ${tool} provisioned for ${companyEmail}`);
        }
        catch (err) {
            await this.logsService.create({
                ...logBase,
                status: log_schema_1.LogStatus.FAILED,
                message: err.message || `${tool} provisioning failed`,
            });
            this.logger.error(`✗ ${tool} provisioning failed for ${companyEmail}: ${err.message}`);
        }
    }
    async runDeprovisioning(event, tool) {
        const logBase = {
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
                status: log_schema_1.LogStatus.SUCCESS,
                message: `${tool} de-provisioned successfully`,
            });
            this.logger.log(`✓ ${tool} de-provisioned for ${event.email}`);
        }
        catch (err) {
            await this.logsService.create({
                ...logBase,
                status: log_schema_1.LogStatus.FAILED,
                message: err.message || `${tool} de-provisioning failed`,
            });
            this.logger.error(`✗ ${tool} de-provisioning failed for ${event.email}: ${err.message}`);
        }
    }
};
exports.ProvisioningService = ProvisioningService;
exports.ProvisioningService = ProvisioningService = ProvisioningService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [logs_service_1.LogsService,
        config_1.ConfigService,
        github_adapter_1.GithubAdapter,
        slack_adapter_1.SlackAdapter,
        google_adapter_1.GoogleAdapter])
], ProvisioningService);
//# sourceMappingURL=provisioning.service.js.map