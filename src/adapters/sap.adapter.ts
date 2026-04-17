import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { IAdapter, AdapterCredentials } from '../common/interfaces/adapter.interface';

interface SapCreds {
  scimBaseUrl: string; // e.g. https://yourorg.accounts.ondemand.com/service/scim
  clientId: string;
  clientSecret: string;
}

/**
 * SAP Adapter
 * Auth: SCIM 2.0 (via OAuth2 client credentials)
 * Docs: https://help.sap.com/docs/identity-provisioning/identity-provisioning/scim-rest-api
 * Uses SAP Cloud Identity Services SCIM endpoint.
 */
@Injectable()
export class SapAdapter implements IAdapter {
  private readonly logger = new Logger(SapAdapter.name);

  constructor(private readonly config: ConfigService) {}

  private creds(credentials?: AdapterCredentials): SapCreds {
    return credentials?.sap ?? {
      scimBaseUrl: this.config.get<string>('sap.scimBaseUrl'),
      clientId: this.config.get<string>('sap.clientId'),
      clientSecret: this.config.get<string>('sap.clientSecret'),
    };
  }

  private headers(c: SapCreds) {
    const encoded = Buffer.from(`${c.clientId}:${c.clientSecret}`).toString('base64');
    return {
      Authorization: `Basic ${encoded}`,
      'Content-Type': 'application/scim+json',
      Accept: 'application/scim+json',
    };
  }

  /** POST /Users — SCIM 2.0 user create */
  async inviteUser(email: string, credentials?: AdapterCredentials): Promise<void> {
    const c = this.creds(credentials);
    if (!c.scimBaseUrl || !c.clientId) {
      this.logger.warn(`SAP: credentials not configured — skipping ${email}`);
      return;
    }
    this.logger.log(`SAP: provisioning user ${email} via SCIM`);
    const [localPart] = email.split('@');
    const [givenName = 'User', familyName = 'Account'] = localPart.split('.');

    await axios.post(
      `${c.scimBaseUrl}/Users`,
      {
        schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'],
        userName: email,
        active: true,
        emails: [{ value: email, primary: true }],
        name: { givenName, familyName },
      },
      { headers: this.headers(c) },
    );
    this.logger.log(`SAP: user ${email} provisioned`);
  }

  /** PATCH /Users/{id} — SCIM deactivate */
  async removeUser(email: string, credentials?: AdapterCredentials): Promise<void> {
    const c = this.creds(credentials);
    if (!c.scimBaseUrl || !c.clientId) {
      this.logger.warn(`SAP: credentials not configured — skipping ${email}`);
      return;
    }
    this.logger.log(`SAP: deprovisioning user ${email} via SCIM`);
    const headers = this.headers(c);

    const searchRes = await axios.get(
      `${c.scimBaseUrl}/Users?filter=userName eq "${email}"`,
      { headers },
    );
    const userId: string | undefined = searchRes.data?.Resources?.[0]?.id;
    if (!userId) throw new Error(`SAP: user not found for ${email}`);

    await axios.patch(
      `${c.scimBaseUrl}/Users/${userId}`,
      {
        schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
        Operations: [{ op: 'Replace', path: 'active', value: false }],
      },
      { headers },
    );
    this.logger.log(`SAP: user ${email} deprovisioned`);
  }

  async assignRoleOrAccess(email: string, role: string, _credentials?: AdapterCredentials): Promise<void> {
    this.logger.log(`SAP: group/role assignment for ${email} (role: ${role})`);
  }
}
