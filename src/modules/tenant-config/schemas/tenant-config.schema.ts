import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TenantConfigDocument = TenantConfig & Document;

export interface TenantCredentials {
  github?: { org: string; token: string };
  slack?: { botToken: string };
  google?: { accessToken?: string };
  jira?: { host: string; email: string; apiToken: string; projectKey?: string };
  salesforce?: { instanceUrl: string; accessToken: string };
}

@Schema({ timestamps: true })
export class TenantConfig {
  @Prop({ required: true, unique: true, index: true })
  tenantId: string;

  @Prop({ required: true })
  companyEmailDomain: string;

  /** Tools enabled for this tenant e.g. ['github', 'slack', 'jira'] */
  @Prop({ type: [String], default: [] })
  enabledTools: string[];

  /** Per-tenant credentials. Override the global .env values in production. */
  @Prop({ type: Object, default: {} })
  credentials: TenantCredentials;
}

export const TenantConfigSchema = SchemaFactory.createForClass(TenantConfig);
