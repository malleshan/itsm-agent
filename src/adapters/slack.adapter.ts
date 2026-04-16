import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

/**
 * Slack Adapter
 *
 * Provisions and de-provisions Slack users via the Web API.
 * Docs: https://api.slack.com/methods/admin.users.invite
 *
 * Test credentials: SLACK_BOT_TOKEN=xoxb-test-000000000000-000000000000-test_slack_token
 */
@Injectable()
export class SlackAdapter {
  private readonly logger = new Logger(SlackAdapter.name);

  constructor(private readonly config: ConfigService) {}

  private get headers() {
    return {
      Authorization: `Bearer ${this.config.get<string>('slack.botToken')}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Invite a user to the Slack workspace.
   * POST https://slack.com/api/users.admin.invite
   */
  async createUser(email: string): Promise<void> {
    this.logger.log(`Slack: inviting ${email}`);

    const response = await axios.post(
      'https://slack.com/api/users.admin.invite',
      { email },
      { headers: this.headers },
    );

    if (!response.data?.ok) {
      throw new Error(`Slack invite failed: ${response.data?.error || 'unknown error'}`);
    }
  }

  /**
   * Deactivate (disable) a Slack user.
   * POST https://slack.com/api/users.admin.setInactive
   *
   * Note: Slack identifies users by user_id. In production resolve the
   * user_id from email via users.lookupByEmail before calling this.
   */
  async deactivateUser(email: string): Promise<void> {
    this.logger.log(`Slack: deactivating user with email ${email}`);

    // Step 1 — resolve user_id from email
    const lookupRes = await axios.get(
      `https://slack.com/api/users.lookupByEmail?email=${encodeURIComponent(email)}`,
      { headers: this.headers },
    );

    if (!lookupRes.data?.ok) {
      throw new Error(`Slack lookup failed: ${lookupRes.data?.error}`);
    }

    const userId = lookupRes.data.user.id;

    // Step 2 — deactivate
    const deactivateRes = await axios.post(
      'https://slack.com/api/users.admin.setInactive',
      { user: userId },
      { headers: this.headers },
    );

    if (!deactivateRes.data?.ok) {
      throw new Error(`Slack deactivation failed: ${deactivateRes.data?.error}`);
    }
  }
}
