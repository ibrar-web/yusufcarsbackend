import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import type { AppRole } from '../../../../entities/user.entity';

export class UpdateAdminUserDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsEnum(['admin', 'user', 'supplier', 'garage'])
  role?: AppRole;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
