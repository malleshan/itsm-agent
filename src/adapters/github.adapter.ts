import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

/**
 * GitHub Adapter
 *
 * Handles organisation membership via the GitHub REST API.
 * Docs: https://docs.github.com/en/rest/orgs/members
 *
 * Test credentials: GITHUB_ORG=test-org, GITHUB_TOKEN=ghp_test_token_placeholder_123456789
 */
@Injectable()
export class GithubAdapter {
  private readonly logger = new Logger(GithubAdapter.name);

  constructor(private readonly config: ConfigService) {}

  private get org(): string {
    return this.config.get<string>('github.org');
  }

  private get headers() {
    return {
      Authorization: `Bearer ${this.config.get<string>('github.token')}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };
  }

  /**
   * Invite a user to the organisation by email.
   * POST /orgs/{org}/invitations
   */
  async inviteUser(email: string): Promise<void> {
    this.logger.log(`GitHub: inviting ${email} to org "${this.org}"`);

    await axios.post(
      `https://api.github.com/orgs/${this.org}/invitations`,
      { email },
      { headers: this.headers },
    );
  }

  /**
   * Remove a member from the organisation.
   * DELETE /orgs/{org}/members/{username}
   *
   * GitHub uses usernames rather than emails. In production, resolve the
   * username from a stored mapping. Here we derive it from the email local-part.
   */
  async removeUser(email: string): Promise<void> {
    const username = email.split('@')[0];
    this.logger.log(`GitHub: removing member "${username}" from org "${this.org}"`);

    await axios.delete(
      `https://api.github.com/orgs/${this.org}/members/${username}`,
      { headers: this.headers },
    );
  }
}
