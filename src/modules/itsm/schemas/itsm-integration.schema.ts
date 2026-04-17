import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { encryptCredentials, decryptCredentials } from '../../../utils/encryption.util';

export type ItsmIntegrationDocument = ItsmIntegration & Document;

export enum IntegrationStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error',
}

@Schema({ collection: 'itsm_integrations', timestamps: true })
export class ItsmIntegration {
  @Prop({ required: true, index: true })
  tenantId: string;

  /** e.g. github | slack | google | microsoft365 | jira | zoom | servicenow | sap | salesforce */
  @Prop({ required: true })
  service: string;

  @Prop({ default: true })
  enabled: boolean;

  /** AES-256-GCM encrypted credential blob */
  @Prop({ type: Object, default: {} })
  credentials: Record<string, any>;

  @Prop({ enum: Object.values(IntegrationStatus), default: IntegrationStatus.ACTIVE })
  status: IntegrationStatus;

  @Prop()
  lastTestedAt?: Date;

  @Prop()
  lastErrorMessage?: string;

  /** Soft delete */
  @Prop()
  deletedAt?: Date;
}

export const ItsmIntegrationSchema = SchemaFactory.createForClass(ItsmIntegration);

ItsmIntegrationSchema.index({ tenantId: 1, service: 1 }, { unique: true, sparse: true });

// Auto-encrypt credentials on save
ItsmIntegrationSchema.pre('save', function (next) {
  if (this.isModified('credentials') && this.credentials) {
    this.credentials = encryptCredentials(this.credentials);
  }
  next();
});

// Auto-decrypt credentials on read
ItsmIntegrationSchema.post('find', (docs: ItsmIntegrationDocument[]) => {
  for (const doc of docs) {
    if (doc.credentials) doc.credentials = decryptCredentials(doc.credentials);
  }
});
ItsmIntegrationSchema.post('findOne', (doc: ItsmIntegrationDocument | null) => {
  if (doc?.credentials) doc.credentials = decryptCredentials(doc.credentials);
});
ItsmIntegrationSchema.post('findOneAndUpdate', (doc: ItsmIntegrationDocument | null) => {
  if (doc?.credentials) doc.credentials = decryptCredentials(doc.credentials);
});
