import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type LogDocument = Log & Document;

export enum LogStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

@Schema({ timestamps: true })
export class Log {
  @Prop()
  employeeId: string;

  @Prop()
  email: string;

  /** Third-party tool name: github | slack | google */
  @Prop()
  tool: string;

  @Prop({ enum: LogStatus })
  status: LogStatus;

  @Prop()
  message: string;
}

export const LogSchema = SchemaFactory.createForClass(Log);
