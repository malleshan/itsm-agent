import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type LogDocument = Log & Document;

export enum LogStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export enum LogAction {
  PROVISION = 'PROVISION',
  DEPROVISION = 'DEPROVISION',
}

@Schema({ collection: 'itsm_provisioning_logs', timestamps: true })
export class Log {
  @Prop({ required: true, index: true })
  employeeId: string;

  @Prop({ required: true, index: true })
  tenantId: string;

  @Prop({ required: true })
  email: string;

  /** Third-party tool: github | slack | google | jira | salesforce */
  @Prop({ required: true })
  tool: string;

  @Prop({ required: true, enum: Object.values(LogAction) })
  action: LogAction;

  @Prop({ required: true, enum: Object.values(LogStatus) })
  status: LogStatus;

  @Prop({ required: true })
  message: string;
}

export const LogSchema = SchemaFactory.createForClass(Log);

// Compound index for fast lookups by tenant + employee
LogSchema.index({ tenantId: 1, employeeId: 1 });
LogSchema.index({ tenantId: 1, email: 1 });
