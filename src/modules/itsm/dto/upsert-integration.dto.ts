import { IsBoolean, IsIn, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export const SUPPORTED_SERVICES = [
  'github', 'slack', 'google', 'microsoft365',
  'jira', 'zoom', 'servicenow', 'sap', 'salesforce',
] as const;

export class UpsertIntegrationDto {
  @IsString() @IsNotEmpty()
  tenantId: string;

  @IsString() @IsIn(SUPPORTED_SERVICES)
  service: string;

  @IsBoolean() @IsOptional()
  enabled?: boolean;

  @IsObject() @IsOptional()
  credentials?: Record<string, any>;
}
