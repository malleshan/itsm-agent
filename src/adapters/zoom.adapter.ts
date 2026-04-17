import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { IAdapter, AdapterCredentials } from '../common/interfaces/adapter.interface';

interface ZoomCreds {
  accountId: string;
  clientId: string;
  clientSecret: string;
}

/**
 * Zoom Adapter
 * Auth: OAuth2 Server-to-Server (Account Credentials)
 * Docs: https://developers.zoom.us/docs/api/rest/reference/zoom-api/methods/#operation/userCreate
 */
@Injectable()
export class ZoomAdapter implements IAdapter {
  private readonly logger = new Logger(ZoomAdapter.name);

  constructor(private readonly config: ConfigService) {}

  private creds(credentials?: AdapterCredentials): ZoomCreds {
    return credentials?.zoom ?? {
      accountId: this.config.get<string>('zoom.accountId'),
      clientId: this.config.get<string>('zoom.clientId'),
      clientSecret: this.config.get<string>('zoom.clientSecret'),
    };
  }

  private async getAccessToken(c: ZoomCreds): Promise<string> {
    const encoded = Buffer.from(`${c.clientId}:${c.clientSecret}`).toString('base64');
    const res = await axios.post(
      `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${c.accountId}`,
      null,
      { headers: { Authorization: `Basic ${encoded}` } },
    );
    return res.data.access_token;
  }

  /** POST https://api.zoom.us/v2/users */
  async inviteUser(email: string, credentials?: AdapterCredentials): Promise<void> {
    const c = this.creds(credentials);
    if (!c.accountId || !c.clientId) {
      this.logger.warn(`Zoom: credentials not configured — skipping ${email}`);
      return;
    }
    this.logger.log(`Zoom: creating user ${email}`);
    const token = await this.getAccessToken(c);
    const [localPart] = email.split('@');
    const [firstName = 'User', lastName = 'Account'] = localPart.split('.');
    await axios.post(
      'https://api.zoom.us/v2/users',
      {
        action: 'create',
        user_info: {
          email,
          type: 1, // Basic user
          first_name: firstName,
          last_name: lastName,
        },
      },
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } },
    );
    this.logger.log(`Zoom: user ${email} created`);
  }

  /** DELETE https://api.zoom.us/v2/users/{userId} */
  async removeUser(email: string, credentials?: AdapterCredentials): Promise<void> {
    const c = this.creds(credentials);
    if (!c.accountId || !c.clientId) {
      this.logger.warn(`Zoom: credentials not configured — skipping ${email}`);
      return;
    }
    this.logger.log(`Zoom: deactivating user ${email}`);
    const token = await this.getAccessToken(c);
    // Deactivate instead of delete
    await axios.put(
      `https://api.zoom.us/v2/users/${encodeURIComponent(email)}/status`,
      { action: 'deactivate' },
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } },
    );
  }

  async assignRoleOrAccess(email: string, role: string, _credentials?: AdapterCredentials): Promise<void> {
    this.logger.log(`Zoom: role assignment for ${email} (role: ${role})`);
  }
}
