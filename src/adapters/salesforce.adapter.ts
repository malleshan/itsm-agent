import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { AdapterCredentials, IAdapter } from '../common/interfaces/adapter.interface';

interface SFCreds {
  instanceUrl: string;
  accessToken: string;
}

/**
 * Salesforce Adapter — manages users via Salesforce REST API.
 * Docs: https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/
 */
@Injectable()
export class SalesforceAdapter implements IAdapter {
  private readonly logger = new Logger(SalesforceAdapter.name);

  constructor(private readonly config: ConfigService) {}

  private creds(credentials?: AdapterCredentials): SFCreds {
    return credentials?.salesforce ?? {
      instanceUrl: this.config.get<string>('salesforce.instanceUrl'),
      accessToken: this.config.get<string>('salesforce.accessToken'),
    };
  }

  private headers(c: SFCreds) {
    return {
      Authorization: `Bearer ${c.accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  private async query<T = any>(c: SFCreds, soql: string): Promise<T[]> {
    const res = await axios.get<{ records: T[] }>(
      `${c.instanceUrl}/services/data/v59.0/query?q=${encodeURIComponent(soql)}`,
      { headers: this.headers(c) },
    );
    return res.data?.records ?? [];
  }

  /** POST /services/data/v59.0/sobjects/User */
  async inviteUser(email: string, credentials?: AdapterCredentials): Promise<void> {
    const c = this.creds(credentials);
    this.logger.log(`Salesforce: creating user ${email}`);

    const [localPart] = email.split('@');
    const [firstName = 'User', lastName = 'Account'] = localPart.split('.');

    await axios.post(
      `${c.instanceUrl}/services/data/v59.0/sobjects/User`,
      {
        FirstName: firstName,
        LastName: lastName,
        Email: email,
        Username: email,
        Alias: localPart.slice(0, 8),
        TimeZoneSidKey: 'America/Los_Angeles',
        LocaleSidKey: 'en_US',
        EmailEncodingKey: 'UTF-8',
        LanguageLocaleKey: 'en_US',
        ProfileId: this.config.get<string>('salesforce.defaultProfileId') ?? '',
      },
      { headers: this.headers(c) },
    );
  }

  /** Deactivate user — Salesforce does not support hard deletion. */
  async removeUser(email: string, credentials?: AdapterCredentials): Promise<void> {
    const c = this.creds(credentials);
    this.logger.log(`Salesforce: deactivating ${email}`);

    const [user] = await this.query<{ Id: string }>(
      c,
      `SELECT Id FROM User WHERE Email='${email}' LIMIT 1`,
    );
    if (!user?.Id) throw new Error(`Salesforce: no user found for ${email}`);

    await axios.patch(
      `${c.instanceUrl}/services/data/v59.0/sobjects/User/${user.Id}`,
      { IsActive: false },
      { headers: this.headers(c) },
    );
  }

  async assignRoleOrAccess(
    email: string,
    role: string,
    credentials?: AdapterCredentials,
  ): Promise<void> {
    const c = this.creds(credentials);
    this.logger.log(`Salesforce: assigning permission set "${role}" to ${email}`);

    const [user] = await this.query<{ Id: string }>(
      c,
      `SELECT Id FROM User WHERE Email='${email}' LIMIT 1`,
    );
    if (!user?.Id) throw new Error(`Salesforce: no user found for ${email}`);

    const [ps] = await this.query<{ Id: string }>(
      c,
      `SELECT Id FROM PermissionSet WHERE Name='${role}' LIMIT 1`,
    );
    if (!ps?.Id) {
      this.logger.warn(`Salesforce: permission set "${role}" not found — skipping`);
      return;
    }

    await axios.post(
      `${c.instanceUrl}/services/data/v59.0/sobjects/PermissionSetAssignment`,
      { AssigneeId: user.Id, PermissionSetId: ps.Id },
      { headers: this.headers(c) },
    );
  }
}
