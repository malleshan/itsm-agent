import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { AdapterCredentials, IAdapter } from '../common/interfaces/adapter.interface';

interface ZohoCreds {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  orgId: string;
  accountsUrl: string;
}

/**
 * Zoho Directory Adapter — manages org users via Zoho Directory API v1.
 * Uses OAuth 2.0 refresh-token flow to obtain short-lived access tokens.
 * Docs: https://www.zoho.com/directory/help/api/
 */
@Injectable()
export class ZohoAdapter implements IAdapter {
  private readonly logger = new Logger(ZohoAdapter.name);

  constructor(private readonly config: ConfigService) {}

  private creds(credentials?: AdapterCredentials): ZohoCreds {
    return credentials?.zoho ?? {
      clientId: this.config.get<string>('zoho.clientId'),
      clientSecret: this.config.get<string>('zoho.clientSecret'),
      refreshToken: this.config.get<string>('zoho.refreshToken'),
      orgId: this.config.get<string>('zoho.orgId'),
      accountsUrl: this.config.get<string>('zoho.accountsUrl'),
    };
  }

  private async getAccessToken(c: ZohoCreds): Promise<string> {
    const res = await axios.post<{ access_token: string }>(
      `${c.accountsUrl}/oauth/v2/token`,
      null,
      {
        params: {
          grant_type: 'refresh_token',
          client_id: c.clientId,
          client_secret: c.clientSecret,
          refresh_token: c.refreshToken,
        },
      },
    );
    return res.data.access_token;
  }

  private async headers(c: ZohoCreds) {
    const token = await this.getAccessToken(c);
    return {
      Authorization: `Zoho-oauthtoken ${token}`,
      'Content-Type': 'application/json',
    };
  }

  private directoryUrl(c: ZohoCreds, path: string) {
    const base = c.accountsUrl.replace('accounts.', 'directory.');
    return `${base}/api/v1/org/${c.orgId}${path}`;
  }

  /** POST /org/{orgId}/users — creates and activates user in Zoho Directory */
  async inviteUser(email: string, credentials?: AdapterCredentials): Promise<void> {
    const c = this.creds(credentials);
    this.logger.log(`Zoho: inviting ${email} to org ${c.orgId}`);

    const [localPart] = email.split('@');
    const [firstName = 'User', lastName = 'Account'] = localPart.split('.');

    await axios.post(
      this.directoryUrl(c, '/users'),
      {
        email,
        first_name: firstName,
        last_name: lastName,
        display_name: `${firstName} ${lastName}`,
      },
      { headers: await this.headers(c) },
    );
  }

  /** DELETE /org/{orgId}/users/{email} — removes user from Zoho Directory */
  async removeUser(email: string, credentials?: AdapterCredentials): Promise<void> {
    const c = this.creds(credentials);
    this.logger.log(`Zoho: removing ${email} from org ${c.orgId}`);

    await axios.delete(
      this.directoryUrl(c, `/users/${encodeURIComponent(email)}`),
      { headers: await this.headers(c) },
    );
  }

  /**
   * Assigns user to a Zoho group (role).
   * `role` is treated as the group name; we search for it then add the member.
   */
  async assignRoleOrAccess(
    email: string,
    role: string,
    credentials?: AdapterCredentials,
  ): Promise<void> {
    const c = this.creds(credentials);
    this.logger.log(`Zoho: assigning group "${role}" to ${email} in org ${c.orgId}`);

    const hdrs = await this.headers(c);

    const groupsRes = await axios.get<{ groups: { group_id: string; group_name: string }[] }>(
      this.directoryUrl(c, '/groups'),
      { headers: hdrs },
    );

    const group = groupsRes.data?.groups?.find(
      (g) => g.group_name.toLowerCase() === role.toLowerCase(),
    );

    if (!group) {
      this.logger.warn(`Zoho: group "${role}" not found in org ${c.orgId} — skipping`);
      return;
    }

    await axios.post(
      this.directoryUrl(c, `/groups/${group.group_id}/members`),
      { email },
      { headers: hdrs },
    );
  }
}
