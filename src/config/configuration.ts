export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,

  mongo: { uri: process.env.MONGO_URI || process.env.MONGO_URI_LOCAL },

  jwt: {
    secret: process.env.JWT_SECRET,
    accessSecret: process.env.ACCESS_SECRET,
    refreshSecret: process.env.REFRESH_SECRET,
  },

  kafka: {
    broker: process.env.KAFKA_BROKER || 'localhost:9092',
    clientId: process.env.KAFKA_CLIENT_ID || 'itsm-producer',
    consumerGroupId: process.env.KAFKA_CONSUMER_GROUP_ID || 'itsm-consumer-group',
    topics: {
      onboarded: process.env.KAFKA_TOPIC_ONBOARDED || 'itsm.employee.onboarded',
      offboarded: process.env.KAFKA_TOPIC_OFFBOARDED || 'itsm.employee.offboarded',
    },
  },

  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || '"ITSM Agent" <noreply@terralogic.com>',
  },

  github: {
    org: process.env.GITHUB_ORG || 'test-org',
    token: process.env.GITHUB_TOKEN || '',
  },

  slack: {
    botToken: process.env.SLACK_BOT_TOKEN || '',
  },

  google: {
    accessToken: process.env.GOOGLE_ACCESS_TOKEN || '',
  },

  jira: {
    host: process.env.JIRA_HOST || '',
    email: process.env.JIRA_EMAIL || '',
    apiToken: process.env.JIRA_API_TOKEN || '',
    projectKey: process.env.JIRA_PROJECT_KEY || 'DEFAULT',
  },

  salesforce: {
    instanceUrl: process.env.SALESFORCE_INSTANCE_URL || '',
    accessToken: process.env.SALESFORCE_ACCESS_TOKEN || '',
    defaultProfileId: process.env.SALESFORCE_DEFAULT_PROFILE_ID || '',
  },

  microsoft365: {
    tenantId: process.env.M365_TENANT_ID || '',
    clientId: process.env.M365_CLIENT_ID || '',
    clientSecret: process.env.M365_CLIENT_SECRET || '',
    domain: process.env.M365_DOMAIN || '',
  },

  zoom: {
    accountId: process.env.ZOOM_ACCOUNT_ID || '',
    clientId: process.env.ZOOM_CLIENT_ID || '',
    clientSecret: process.env.ZOOM_CLIENT_SECRET || '',
  },

  servicenow: {
    instance: process.env.SERVICENOW_INSTANCE || '',
    username: process.env.SERVICENOW_USERNAME || '',
    password: process.env.SERVICENOW_PASSWORD || '',
  },

  sap: {
    scimBaseUrl: process.env.SAP_SCIM_BASE_URL || '',
    clientId: process.env.SAP_CLIENT_ID || '',
    clientSecret: process.env.SAP_CLIENT_SECRET || '',
  },

  zoho: {
    clientId: process.env.ZOHO_CLIENT_ID || '',
    clientSecret: process.env.ZOHO_CLIENT_SECRET || '',
    refreshToken: process.env.ZOHO_REFRESH_TOKEN || '',
    orgId: process.env.ZOHO_ORG_ID || '',
    accountsUrl: process.env.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.com',
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || '',
  },

  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
  },

  encryption: {
    key: process.env.ENCRYPTION_KEY || '',
  },

  company: {
    emailDomain: process.env.COMPANY_EMAIL_DOMAIN || 'terralogic.com',
  },
});
