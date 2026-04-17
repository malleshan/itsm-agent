import { IsArray, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class UpsertTenantConfigDto {
  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @IsString()
  @IsNotEmpty()
  companyEmailDomain: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  enabledTools?: string[];

  @IsObject()
  @IsOptional()
  credentials?: {
    github?: { org: string; token: string };
    slack?: { botToken: string };
    google?: { accessToken?: string };
    jira?: { host: string; email: string; apiToken: string; projectKey?: string };
    salesforce?: { instanceUrl: string; accessToken: string };
  };
}
