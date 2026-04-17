import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { IAdapter, AdapterCredentials } from '../common/interfaces/adapter.interface';

interface ServiceNowCreds {
  instance: string; // e.g. dev12345.service-now.com
  username: string;
  password: string;
}

/**
 * ServiceNow Adapter
 * Auth: Basic Auth
 * Docs: https://developer.servicenow.com/dev.do#!/reference/api/latest/rest/c_TableAPI
 * Uses the sys_user table for user management.
 */
@Injectable()
export class ServiceNowAdapter implements IAdapter {
  private readonly logger = new Logger(ServiceNowAdapter.name);

  constructor(private readonly config: ConfigService) {}

  private creds(credentials?: AdapterCredentials): ServiceNowCreds {
    return credentials?.servicenow ?? {
      instance: this.config.get<string>('servicenow.instance'),
      username: this.config.get<string>('servicenow.username'),
      password: this.config.get<string>('servicenow.password'),
    };
  }

  private headers(c: ServiceNowCreds) {
    const encoded = Buffer.from(`${c.username}:${c.password}`).toString('base64');
    return {
      Authorization: `Basic ${encoded}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  }

  private baseUrl(c: ServiceNowCreds) {
    return `https://${c.instance}/api/now/table`;
  }

  /** POST /api/now/table/sys_user */
  async inviteUser(email: string, credentials?: AdapterCredentials): Promise<void> {
    const c = this.creds(credentials);
    if (!c.instance || !c.username) {
      this.logger.warn(`ServiceNow: credentials not configured — skipping ${email}`);
      return;
    }
    this.logger.log(`ServiceNow: creating user ${email}`);
    const [localPart] = email.split('@');
    const [firstName = 'User', lastName = 'Account'] = localPart.split('.');
    await axios.post(
      `${this.baseUrl(c)}/sys_user`,
      {
        user_name: localPart,
        email,
        first_name: firstName,
        last_name: lastName,
        active: true,
      },
      { headers: this.headers(c) },
    );
    this.logger.log(`ServiceNow: user ${email} created`);
  }

  /** PATCH /api/now/table/sys_user/{sysId} — set active=false */
  async removeUser(email: string, credentials?: AdapterCredentials): Promise<void> {
    const c = this.creds(credentials);
    if (!c.instance || !c.username) {
      this.logger.warn(`ServiceNow: credentials not configured — skipping ${email}`);
      return;
    }
    this.logger.log(`ServiceNow: deactivating user ${email}`);
    const headers = this.headers(c);

    const searchRes = await axios.get(
      `${this.baseUrl(c)}/sys_user?sysparm_query=email=${encodeURIComponent(email)}&sysparm_limit=1`,
      { headers },
    );
    const sysId: string | undefined = searchRes.data?.result?.[0]?.sys_id;
    if (!sysId) throw new Error(`ServiceNow: user not found for ${email}`);

    await axios.patch(
      `${this.baseUrl(c)}/sys_user/${sysId}`,
      { active: false },
      { headers },
    );
  }

  async assignRoleOrAccess(email: string, role: string, _credentials?: AdapterCredentials): Promise<void> {
    this.logger.log(`ServiceNow: role "${role}" assignment for ${email}`);
  }
}
