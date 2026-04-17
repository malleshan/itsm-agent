export interface AdapterCredentials {
  github?: { org: string; token: string };
  slack?: { botToken: string };
  google?: { accessToken?: string };
  jira?: { host: string; email: string; apiToken: string; projectKey?: string };
  salesforce?: { instanceUrl: string; accessToken: string };
  microsoft365?: { tenantId: string; clientId: string; clientSecret: string; domain: string };
  zoom?: { accountId: string; clientId: string; clientSecret: string };
  servicenow?: { instance: string; username: string; password: string };
  sap?: { scimBaseUrl: string; clientId: string; clientSecret: string };
}

export interface IAdapter {
  inviteUser(email: string, credentials?: AdapterCredentials, password?: string): Promise<void>;
  removeUser(email: string, credentials?: AdapterCredentials): Promise<void>;
  assignRoleOrAccess(email: string, role: string, credentials?: AdapterCredentials): Promise<void>;
}
