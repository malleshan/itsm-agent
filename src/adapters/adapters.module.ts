import { Module } from '@nestjs/common';
import { GithubAdapter } from './github.adapter';
import { SlackAdapter } from './slack.adapter';
import { GoogleAdapter } from './google.adapter';
import { JiraAdapter } from './jira.adapter';
import { SalesforceAdapter } from './salesforce.adapter';
import { Microsoft365Adapter } from './microsoft365.adapter';
import { ZoomAdapter } from './zoom.adapter';
import { ServiceNowAdapter } from './servicenow.adapter';
import { SapAdapter } from './sap.adapter';
import { ZohoAdapter } from './zoho.adapter';

/** All 10 SaaS adapters registered and exported for DI. */
@Module({
  providers: [
    GithubAdapter,
    SlackAdapter,
    GoogleAdapter,
    JiraAdapter,
    SalesforceAdapter,
    Microsoft365Adapter,
    ZoomAdapter,
    ServiceNowAdapter,
    SapAdapter,
    ZohoAdapter,
  ],
  exports: [
    GithubAdapter,
    SlackAdapter,
    GoogleAdapter,
    JiraAdapter,
    SalesforceAdapter,
    Microsoft365Adapter,
    ZoomAdapter,
    ServiceNowAdapter,
    SapAdapter,
    ZohoAdapter,
  ],
})
export class AdaptersModule {}
