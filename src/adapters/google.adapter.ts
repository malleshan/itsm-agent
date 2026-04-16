import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

/**
 * Google Workspace Adapter
 *
 * Manages users via the Admin SDK Directory API.
 * Docs: https://developers.google.com/admin-sdk/directory/v1/reference/users
 *
 * Authentication in production: OAuth2 / Service Account with domain-wide delegation.
 * For test purposes this adapter simulates the calls and logs the intent.
 */
@Injectable()
export class GoogleAdapter {
  private readonly logger = new Logger(GoogleAdapter.name);

  constructor(private readonly config: ConfigService) {}

  /**
   * Create a Google Workspace user.
   * POST https://admin.googleapis.com/admin/directory/v1/users
   */
  async createUser(email: string, password: string): Promise<void> {
    this.logger.log(`Google: creating user ${email}`);

    const [localPart] = email.split('@');
    const [firstName, lastName = 'User'] = localPart.split('.');

    // In production, replace this with a real OAuth2-authenticated request.
    // Example payload shown below; actual call requires a valid access token.
    const payload = {
      primaryEmail: email,
      password,
      name: {
        givenName: firstName,
        familyName: lastName,
      },
      changePasswordAtNextLogin: true,
    };

    this.logger.debug(`Google Workspace payload: ${JSON.stringify(payload)}`);

    // TODO: replace with real service-account token
    // await axios.post(
    //   'https://admin.googleapis.com/admin/directory/v1/users',
    //   payload,
    //   { headers: { Authorization: `Bearer ${accessToken}` } },
    // );

    this.logger.log(`Google: user ${email} created (simulated)`);
  }

  /**
   * Suspend a Google Workspace user.
   * PATCH https://admin.googleapis.com/admin/directory/v1/users/{userKey}
   */
  async suspendUser(email: string): Promise<void> {
    this.logger.log(`Google: suspending user ${email}`);

    // TODO: replace with real service-account token
    // await axios.patch(
    //   `https://admin.googleapis.com/admin/directory/v1/users/${encodeURIComponent(email)}`,
    //   { suspended: true },
    //   { headers: { Authorization: `Bearer ${accessToken}` } },
    // );

    this.logger.log(`Google: user ${email} suspended (simulated)`);
  }

  /**
   * Delete a Google Workspace user.
   * DELETE https://admin.googleapis.com/admin/directory/v1/users/{userKey}
   */
  async deleteUser(email: string): Promise<void> {
    this.logger.log(`Google: deleting user ${email}`);

    // TODO: replace with real service-account token
    // await axios.delete(
    //   `https://admin.googleapis.com/admin/directory/v1/users/${encodeURIComponent(email)}`,
    //   { headers: { Authorization: `Bearer ${accessToken}` } },
    // );

    this.logger.log(`Google: user ${email} deleted (simulated)`);
  }
}
