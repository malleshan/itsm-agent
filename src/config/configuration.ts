export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,

  mongo: {
    uri: process.env.MONGO_URI,
  },

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

  github: {
    org: process.env.GITHUB_ORG || 'test-org',
    token: process.env.GITHUB_TOKEN || 'ghp_test_token_placeholder_123456789',
  },

  slack: {
    botToken: process.env.SLACK_BOT_TOKEN || 'xoxb-test-000000000000-000000000000-test_slack_token',
  },

  company: {
    emailDomain: process.env.COMPANY_EMAIL_DOMAIN || 'terralogic.com',
  },
});
