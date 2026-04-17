import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { AdapterCredentials, IAdapter } from '../common/interfaces/adapter.interface';

/**
 * Slack Adapter — manages Slack workspace users via the Web API.
 * Docs: https://api.slack.com/methods
 */
@Injectable()
export class SlackAdapter implements IAdapter {
  private readonly logger = new Logger(SlackAdapter.name);

  constructor(private readonly config: ConfigService) {}

  private token(c?: AdapterCredentials) {
    return c?.slack?.botToken ?? this.config.get<string>('slack.botToken');
  }

  private headers(c?: AdapterCredentials) {
    return {
      Authorization: `Bearer ${this.token(c)}`,
      'Content-Type': 'application/json',
    };
  }

  async inviteUser(email: string, credentials?: AdapterCredentials): Promise<void> {
    this.logger.log(`Slack: inviting ${email}`);

    const res = await axios.post(
      'https://slack.com/api/users.admin.invite',
      { email },
      { headers: this.headers(credentials) },
    );

    if (!res.data?.ok) {
      throw new Error(`Slack invite failed: ${res.data?.error ?? 'unknown'}`);
    }
  }

  async removeUser(email: string, credentials?: AdapterCredentials): Promise<void> {
    this.logger.log(`Slack: deactivating ${email}`);
    const headers = this.headers(credentials);

    const lookupRes = await axios.get(
      `https://slack.com/api/users.lookupByEmail?email=${encodeURIComponent(email)}`,
      { headers },
    );
    if (!lookupRes.data?.ok) {
      throw new Error(`Slack lookup failed: ${lookupRes.data?.error}`);
    }

    const userId: string = lookupRes.data.user.id;

    const deactivateRes = await axios.post(
      'https://slack.com/api/users.admin.setInactive',
      { user: userId },
      { headers },
    );
    if (!deactivateRes.data?.ok) {
      throw new Error(`Slack deactivation failed: ${deactivateRes.data?.error}`);
    }
  }

  async assignRoleOrAccess(
    email: string,
    role: string,
    _credentials?: AdapterCredentials,
  ): Promise<void> {
    this.logger.log(`Slack: channel membership assignment for ${email} (role: ${role})`);
  }
}
