import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { AdapterCredentials, IAdapter } from '../common/interfaces/adapter.interface';

interface JiraCreds {
  host: string;
  email: string;
  apiToken: string;
  projectKey?: string;
}

/**
 * Jira Cloud Adapter — manages users via Atlassian REST API v3.
 * Docs: https://developer.atlassian.com/cloud/jira/platform/rest/v3/
 */
@Injectable()
export class JiraAdapter implements IAdapter {
  private readonly logger = new Logger(JiraAdapter.name);

  constructor(private readonly config: ConfigService) {}

  private creds(credentials?: AdapterCredentials): JiraCreds {
    return credentials?.jira ?? {
      host: this.config.get<string>('jira.host'),
      email: this.config.get<string>('jira.email'),
      apiToken: this.config.get<string>('jira.apiToken'),
      projectKey: this.config.get<string>('jira.projectKey'),
    };
  }

  private authHeader(c: JiraCreds) {
    const encoded = Buffer.from(`${c.email}:${c.apiToken}`).toString('base64');
    return `Basic ${encoded}`;
  }

  private buildHeaders(c: JiraCreds) {
    return {
      Authorization: this.authHeader(c),
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  }

  /** POST /rest/api/3/user */
  async inviteUser(email: string, credentials?: AdapterCredentials): Promise<void> {
    const c = this.creds(credentials);
    this.logger.log(`Jira: inviting ${email} to ${c.host}`);

    await axios.post(
      `https://${c.host}/rest/api/3/user`,
      { emailAddress: email, products: ['jira-software'] },
      { headers: this.buildHeaders(c) },
    );
  }

  /** DELETE /rest/api/3/user?accountId={id} */
  async removeUser(email: string, credentials?: AdapterCredentials): Promise<void> {
    const c = this.creds(credentials);
    this.logger.log(`Jira: removing ${email} from ${c.host}`);

    const headers = this.buildHeaders(c);

    const searchRes = await axios.get(
      `https://${c.host}/rest/api/3/user/search?query=${encodeURIComponent(email)}`,
      { headers },
    );

    const accountId: string | undefined = searchRes.data?.[0]?.accountId;
    if (!accountId) throw new Error(`Jira: no account found for ${email}`);

    await axios.delete(
      `https://${c.host}/rest/api/3/user?accountId=${accountId}`,
      { headers },
    );
  }

  async assignRoleOrAccess(
    email: string,
    role: string,
    credentials?: AdapterCredentials,
  ): Promise<void> {
    const c = this.creds(credentials);
    const projectKey = c.projectKey ?? 'DEFAULT';
    this.logger.log(`Jira: assigning role "${role}" to ${email} on project ${projectKey}`);

    const headers = this.buildHeaders(c);
    const searchRes = await axios.get(
      `https://${c.host}/rest/api/3/user/search?query=${encodeURIComponent(email)}`,
      { headers },
    );
    const accountId: string | undefined = searchRes.data?.[0]?.accountId;
    if (!accountId) throw new Error(`Jira: no account found for ${email}`);

    // Role ID 10002 = Developer (default). Override projectKey per tenant.
    await axios.post(
      `https://${c.host}/rest/api/3/project/${projectKey}/role/10002`,
      { user: [accountId] },
      { headers },
    );
  }
}
