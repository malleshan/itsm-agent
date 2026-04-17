import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { AdapterCredentials, IAdapter } from '../common/interfaces/adapter.interface';

/**
 * GitHub Adapter — manages org membership via REST API v3.
 * Docs: https://docs.github.com/en/rest/orgs/members
 *
 * NOTE: GitHub does not create accounts — it sends an invitation email.
 */
@Injectable()
export class GithubAdapter implements IAdapter {
  private readonly logger = new Logger(GithubAdapter.name);

  constructor(private readonly config: ConfigService) {}

  private org(c?: AdapterCredentials) {
    return c?.github?.org ?? this.config.get<string>('github.org');
  }

  private headers(c?: AdapterCredentials) {
    return {
      Authorization: `Bearer ${c?.github?.token ?? this.config.get<string>('github.token')}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };
  }

  /** POST /orgs/{org}/invitations */
  async inviteUser(email: string, credentials?: AdapterCredentials): Promise<void> {
    const org = this.org(credentials);
    this.logger.log(`GitHub: inviting ${email} to org "${org}"`);

    await axios.post(
      `https://api.github.com/orgs/${org}/invitations`,
      { email },
      { headers: this.headers(credentials) },
    );
  }

  /** DELETE /orgs/{org}/members/{username} */
  async removeUser(email: string, credentials?: AdapterCredentials): Promise<void> {
    const org = this.org(credentials);
    const username = email.split('@')[0];
    this.logger.log(`GitHub: removing member "${username}" from org "${org}"`);

    await axios.delete(
      `https://api.github.com/orgs/${org}/members/${username}`,
      { headers: this.headers(credentials) },
    );
  }

  async assignRoleOrAccess(
    email: string,
    role: string,
    _credentials?: AdapterCredentials,
  ): Promise<void> {
    this.logger.log(`GitHub: team role assignment for ${email} (role: ${role}) — manage via Teams API`);
  }
}
