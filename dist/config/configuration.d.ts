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
    github: {
        org: string;
        token: string;
    };
    slack: {
        botToken: string;
    };
    company: {
        emailDomain: string;
    };
};
export default _default;
