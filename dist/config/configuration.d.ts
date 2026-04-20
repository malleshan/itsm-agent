declare const _default: () => {
    port: number;
    mongo: {
        uri: string;
    };
    jwt: {
        secret: string;
        accessSecret: string;
        refreshSecret: string;
    };
    kafka: {
        broker: string;
        clientId: string;
        consumerGroupId: string;
        topics: {
            onboarded: string;
            offboarded: string;
        };
    };
    smtp: {
        host: string;
        port: number;
        secure: boolean;
        user: string;
        pass: string;
        from: string;
    };
    github: {
        org: string;
        token: string;
    };
    slack: {
        botToken: string;
    };
    google: {
        accessToken: string;
    };
    jira: {
        host: string;
        email: string;
        apiToken: string;
        projectKey: string;
    };
    salesforce: {
        instanceUrl: string;
        accessToken: string;
        defaultProfileId: string;
    };
    microsoft365: {
        tenantId: string;
        clientId: string;
        clientSecret: string;
        domain: string;
    };
    zoom: {
        accountId: string;
        clientId: string;
        clientSecret: string;
    };
    servicenow: {
        instance: string;
        username: string;
        password: string;
    };
    sap: {
        scimBaseUrl: string;
        clientId: string;
        clientSecret: string;
    };
    zoho: {
        clientId: string;
        clientSecret: string;
        refreshToken: string;
        orgId: string;
        accountsUrl: string;
    };
    redis: {
        host: string;
        port: number;
        password: string;
    };
    openai: {
        apiKey: string;
    };
    encryption: {
        key: string;
    };
    company: {
        emailDomain: string;
    };
};
export default _default;
