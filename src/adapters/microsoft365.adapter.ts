import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { IAdapter, AdapterCredentials } from '../common/interfaces/adapter.interface';

interface M365Creds {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  domain: string;
}

/**
 * Microsoft 365 Adapter
 * Auth: OAuth2 Client Credentials via Microsoft Identity Platform
 * Docs: https://learn.microsoft.com/en-us/graph/api/resources/users
 */
@Injectable()
export class Microsoft365Adapter implements IAdapter {
  private readonly logger = new Logger(Microsoft365Adapter.name);

  constructor(private readonly config: ConfigService) {}

  private creds(credentials?: AdapterCredentials): M365Creds {
    return credentials?.microsoft365 ?? {
      tenantId: this.config.get<string>('microsoft365.tenantId'),
      clientId: this.config.get<string>('microsoft365.clientId'),
      clientSecret: this.config.get<string>('microsoft365.clientSecret'),
      domain: this.config.get<string>('microsoft365.domain'),
    };
  }

  private async getAccessToken(c: M365Creds): Promise<string> {
    const res = await axios.post(
      `https://login.microsoftonline.com/${c.tenantId}/oauth2/v2.0/token`,
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: c.clientId,
        client_secret: c.clientSecret,
        scope: 'https://graph.microsoft.com/.default',
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );
    return res.data.access_token;
  }

  /** POST https://graph.microsoft.com/v1.0/users */
  async inviteUser(email: string, credentials?: AdapterCredentials, password?: string): Promise<void> {
    const c = this.creds(credentials);
    if (!c.tenantId || !c.clientId) {
      this.logger.warn(`Microsoft 365: credentials not configured — skipping ${email}`);
      return;
    }
    this.logger.log(`Microsoft 365: creating user ${email}`);
    const token = await this.getAccessToken(c);
    const [localPart] = email.split('@');
    const [givenName = 'User', surname = 'Account'] = localPart.split('.');
    await axios.post(
      'https://graph.microsoft.com/v1.0/users',
      {
        accountEnabled: true,
        displayName: `${givenName} ${surname}`,
        mailNickname: localPart,
        userPrincipalName: email,
        givenName,
        surname,
        passwordProfile: {
          forceChangePasswordNextSignIn: true,
          password: password ?? 'TempPass@123!',
        },
      },
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } },
    );
    this.logger.log(`Microsoft 365: user ${email} created`);
  }

  /** DELETE https://graph.microsoft.com/v1.0/users/{id} */
  async removeUser(email: string, credentials?: AdapterCredentials): Promise<void> {
    const c = this.creds(credentials);
    if (!c.tenantId || !c.clientId) {
      this.logger.warn(`Microsoft 365: credentials not configured — skipping ${email}`);
      return;
    }
    this.logger.log(`Microsoft 365: disabling user ${email}`);
    const token = await this.getAccessToken(c);
    // Disable instead of delete (best practice)
    const searchRes = await axios.get(
      `https://graph.microsoft.com/v1.0/users?$filter=userPrincipalName eq '${email}'`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const userId: string | undefined = searchRes.data?.value?.[0]?.id;
    if (!userId) throw new Error(`Microsoft 365: user not found for ${email}`);
    await axios.patch(
      `https://graph.microsoft.com/v1.0/users/${userId}`,
      { accountEnabled: false },
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } },
    );
  }

  async assignRoleOrAccess(email: string, role: string, _credentials?: AdapterCredentials): Promise<void> {
    this.logger.log(`Microsoft 365: license/group assignment for ${email} (role: ${role})`);
  }
}
