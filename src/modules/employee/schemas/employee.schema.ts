import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EmployeeDocument = Employee & Document;

export enum EmployeeStatus {
  ACTIVE = 'ACTIVE',
  OFFBOARDED = 'OFFBOARDED',
}

@Schema({ timestamps: true })
export class Employee {
  @Prop({ required: true })
  tenantId: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  /** Stored as firstName + ' ' + lastName for display convenience. */
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  role: string;

  @Prop()
  department: string;

  @Prop({ default: EmployeeStatus.ACTIVE, enum: EmployeeStatus })
  status: EmployeeStatus;
}

export const EmployeeSchema = SchemaFactory.createForClass(Employee);

EmployeeSchema.index({ tenantId: 1, status: 1 });
EmployeeSchema.index({ tenantId: 1, email: 1 });
