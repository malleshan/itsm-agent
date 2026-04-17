import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;
  private isReady = false;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const host = this.config.get<string>('smtp.host');
    const user = this.config.get<string>('smtp.user');

    if (!host || !user) {
      this.logger.warn('SMTP not configured — emails will be printed to console only');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port: this.config.get<number>('smtp.port') ?? 587,
      secure: this.config.get<boolean>('smtp.secure') ?? false,
      auth: {
        user,
        pass: this.config.get<string>('smtp.pass'),
      },
    });

    try {
      await this.transporter.verify();
      this.isReady = true;
      this.logger.log(`SMTP ready on ${host}:${this.config.get('smtp.port') ?? 587}`);
    } catch (err: any) {
      this.logger.warn(`SMTP verify failed (${err.message}) — emails will be console-logged`);
    }
  }

  /** Send onboarding welcome email with credentials and tool list. */
  async sendOnboardingEmail(params: {
    to: string;
    firstName: string;
    password: string;
    tools: string[];
    tenantId: string;
  }): Promise<void> {
    const { to, firstName, password, tools } = params;
    await this.dispatch({
      to,
      subject: 'Welcome — Your Company Account Is Ready',
      html: this.onboardingHtml({ firstName, email: to, password, tools }),
    });
  }

  /** Send offboarding notice with list of tools that were de-provisioned. */
  async sendOffboardingEmail(params: {
    to: string;
    firstName: string;
    tools: string[];
  }): Promise<void> {
    const { to, firstName, tools } = params;
    await this.dispatch({
      to,
      subject: 'Account Deactivation Notice',
      html: this.offboardingHtml({ firstName, email: to, tools }),
    });
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async dispatch(mail: { to: string; subject: string; html: string }): Promise<void> {
    if (!this.isReady || !this.transporter) {
      // Graceful fallback: log the email to console so dev environments still see it
      this.logger.log(`[EMAIL PREVIEW] To: ${mail.to} | Subject: ${mail.subject}`);
      this.logger.verbose(`[EMAIL BODY]\n${mail.html.replace(/<[^>]*>/g, '').trim()}`);
      return;
    }

    const from =
      this.config.get<string>('smtp.from') ?? `"ITSM Agent" <noreply@terralogic.com>`;

    const info = await this.transporter.sendMail({ from, ...mail });
    this.logger.log(`Email dispatched → ${mail.to} (id: ${info.messageId})`);
  }

  private readonly TOOL_URLS: Record<string, string> = {
    github:       'https://github.com',
    slack:        'https://app.slack.com',
    jira:         'https://id.atlassian.com',
    google:       'https://mail.google.com',
    microsoft365: 'https://office.com',
    zoom:         'https://zoom.us',
    servicenow:   'https://www.servicenow.com',
    sap:          'https://accounts.sap.com',
    salesforce:   'https://login.salesforce.com',
  };

  private onboardingHtml(p: {
    firstName: string;
    email: string;
    password: string;
    tools: string[];
  }): string {
    const toolRows = p.tools
      .map((t) => {
        const label = t.charAt(0).toUpperCase() + t.slice(1);
        const url = this.TOOL_URLS[t.toLowerCase()];
        const link = url
          ? `<a href="${url}" style="color:#1d4ed8">${url}</a>`
          : '—';
        return `<tr>
          <td style="padding:6px 12px;border:1px solid #e5e7eb;font-weight:600">${label}</td>
          <td style="padding:6px 12px;border:1px solid #e5e7eb">${link}</td>
        </tr>`;
      })
      .join('');

    return `
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#f9fafb;padding:24px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:8px;padding:32px;border:1px solid #e5e7eb">

    <h2 style="color:#1d4ed8;margin-top:0">Welcome, ${p.firstName}!</h2>
    <p style="color:#374151">Your company account has been provisioned. Use the credentials below to sign in.</p>

    <table style="border-collapse:collapse;width:100%;margin-top:16px">
      <tr>
        <td style="padding:8px 12px;border:1px solid #e5e7eb;background:#f3f4f6;font-weight:600;width:40%">Username (Email)</td>
        <td style="padding:8px 12px;border:1px solid #e5e7eb">${p.email}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px;border:1px solid #e5e7eb;background:#f3f4f6;font-weight:600">Temporary Password</td>
        <td style="padding:8px 12px;border:1px solid #e5e7eb;font-family:monospace;letter-spacing:2px">${p.password}</td>
      </tr>
    </table>

    <h3 style="color:#374151;margin-top:24px">Tools You Can Access</h3>
    <table style="border-collapse:collapse;width:100%">
      <tr>
        <th style="padding:6px 12px;border:1px solid #e5e7eb;background:#f3f4f6;text-align:left">Tool</th>
        <th style="padding:6px 12px;border:1px solid #e5e7eb;background:#f3f4f6;text-align:left">Login URL</th>
      </tr>
      ${toolRows}
    </table>
    <p style="color:#374151;font-size:13px;margin-top:8px">
      Login with: <strong>${p.email}</strong> and the temporary password above.
    </p>

    <div style="background:#fef9c3;border:1px solid #facc15;border-radius:6px;padding:12px;margin-top:20px;color:#713f12">
      <strong>Action Required:</strong> Please change your temporary password immediately after your first login.
    </div>

    <p style="color:#9ca3af;font-size:11px;margin-top:24px;border-top:1px solid #e5e7eb;padding-top:12px">
      This is an automated message from the ITSM Automation Agent. Do not reply.
    </p>
  </div>
</body>
</html>`;
  }

  private offboardingHtml(p: {
    firstName: string;
    email: string;
    tools: string[];
  }): string {
    const toolRows = p.tools
      .map(
        (t) =>
          `<li style="margin:4px 0">${t.charAt(0).toUpperCase() + t.slice(1)}</li>`,
      )
      .join('');

    return `
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#f9fafb;padding:24px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:8px;padding:32px;border:1px solid #e5e7eb">

    <h2 style="color:#dc2626;margin-top:0">Account Deactivation Notice</h2>
    <p style="color:#374151">Dear <strong>${p.firstName}</strong>,</p>
    <p style="color:#374151">
      Your access to the following tools has been removed as of
      <strong>${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>:
    </p>

    <ul style="color:#374151;padding-left:20px">${toolRows}</ul>

    <p style="color:#374151">
      Account: <strong>${p.email}</strong>
    </p>

    <p style="color:#374151">
      If you believe this is an error, please contact your HR department immediately.
    </p>

    <p style="color:#9ca3af;font-size:11px;margin-top:24px;border-top:1px solid #e5e7eb;padding-top:12px">
      This is an automated message from the ITSM Automation Agent. Do not reply.
    </p>
  </div>
</body>
</html>`;
  }
}
