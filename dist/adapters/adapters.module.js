"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdaptersModule = void 0;
const common_1 = require("@nestjs/common");
const github_adapter_1 = require("./github.adapter");
const slack_adapter_1 = require("./slack.adapter");
const google_adapter_1 = require("./google.adapter");
const jira_adapter_1 = require("./jira.adapter");
const salesforce_adapter_1 = require("./salesforce.adapter");
const microsoft365_adapter_1 = require("./microsoft365.adapter");
const zoom_adapter_1 = require("./zoom.adapter");
const servicenow_adapter_1 = require("./servicenow.adapter");
const sap_adapter_1 = require("./sap.adapter");
const zoho_adapter_1 = require("./zoho.adapter");
let AdaptersModule = class AdaptersModule {
};
exports.AdaptersModule = AdaptersModule;
exports.AdaptersModule = AdaptersModule = __decorate([
    (0, common_1.Module)({
        providers: [
            github_adapter_1.GithubAdapter,
            slack_adapter_1.SlackAdapter,
            google_adapter_1.GoogleAdapter,
            jira_adapter_1.JiraAdapter,
            salesforce_adapter_1.SalesforceAdapter,
            microsoft365_adapter_1.Microsoft365Adapter,
            zoom_adapter_1.ZoomAdapter,
            servicenow_adapter_1.ServiceNowAdapter,
            sap_adapter_1.SapAdapter,
            zoho_adapter_1.ZohoAdapter,
        ],
        exports: [
            github_adapter_1.GithubAdapter,
            slack_adapter_1.SlackAdapter,
            google_adapter_1.GoogleAdapter,
            jira_adapter_1.JiraAdapter,
            salesforce_adapter_1.SalesforceAdapter,
            microsoft365_adapter_1.Microsoft365Adapter,
            zoom_adapter_1.ZoomAdapter,
            servicenow_adapter_1.ServiceNowAdapter,
            sap_adapter_1.SapAdapter,
            zoho_adapter_1.ZohoAdapter,
        ],
    })
], AdaptersModule);
//# sourceMappingURL=adapters.module.js.map