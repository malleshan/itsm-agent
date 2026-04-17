import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { AdapterCredentials, IAdapter } from '../common/interfaces/adapter.interface';

/**
 * Google Workspace Adapter
 *
 * Manages users via the Admin SDK Directory API.
 * Docs: https://developers.google.com/admin-sdk/directory/v1/reference/users
 *
 * Production auth: OAuth2 Service Account with domain-wide delegation.
 * The accessToken must be obtained externally and stored in tenant credentials.
 */
@Injectable()
export class GoogleAdapter implements IAdapter {
  private readonly logger = new Logger(GoogleAdapter.name);

  constructor(private readonly config: ConfigService) {}

  private resolveToken(credentials?: AdapterCredentials): string | undefined {
    return credentials?.google?.accessToken ?? this.config.get<string>('google.accessToken');
  }

  /**
   * Create a Google Workspace user account.
   * The `password` parameter is the provisioned temporary password so it is
   * consistent with what gets emailed to the employee.
   *
   * POST https://admin.googleapis.com/admin/directory/v1/users
   */
  async inviteUser(
    email: string,
    credentials?: AdapterCredentials,
    password?: string,
  ): Promise<void> {
    const accessToken = this.resolveToken(credentials);
    const [localPart] = email.split('@');
    const [firstName, lastName = 'User'] = localPart.split('.');

    this.logger.log(`Google Workspace: creating user ${email}`);

    if (!accessToken) {
      this.logger.warn(`Google Workspace: no access token available — creation of ${email} skipped (configure google.accessToken)`);
      return;
    }

    await axios.post(
      'https://admin.googleapis.com/admin/directory/v1/users',
      {
        primaryEmail: email,
        password: password ?? 'ChangeMe@123!',
        name: { givenName: firstName, familyName: lastName },
        changePasswordAtNextLogin: true,
      },
      { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } },
    );

    this.logger.log(`Google Workspace: user ${email} created`);
  }

  /**
   * Suspend a Google Workspace user.
   * PATCH https://admin.googleapis.com/admin/directory/v1/users/{userKey}
   */
  async removeUser(email: string, credentials?: AdapterCredentials): Promise<void> {
    const accessToken = this.resolveToken(credentials);
    this.logger.log(`Google Workspace: suspending user ${email}`);

    if (!accessToken) {
      this.logger.warn(`Google Workspace: no access token — suspension of ${email} skipped`);
      return;
    }

    await axios.patch(
      `https://admin.googleapis.com/admin/directory/v1/users/${encodeURIComponent(email)}`,
      { suspended: true },
      { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } },
    );

    this.logger.log(`Google Workspace: user ${email} suspended`);
  }

  async assignRoleOrAccess(
    email: string,
    role: string,
    credentials?: AdapterCredentials,
  ): Promise<void> {
    this.logger.log(`Google Workspace: OU/group assignment for ${email} (role: ${role}) — implement via Admin SDK Groups API`);
  }
}
