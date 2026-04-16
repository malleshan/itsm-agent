import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateEmployeeDto {
  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
    @IsOptional()   // ✅ CHANGE HERE
  email?: string; // ✅ optional

  @IsString()
  @IsNotEmpty()
  role: string;

  @IsString()
  @IsOptional()
  department?: string;
}
