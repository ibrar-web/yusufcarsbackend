import { IsEmail, IsEnum, IsOptional, IsString, MinLength, IsBoolean } from 'class-validator';
import type { AppRole } from '../../../users/user.entity';

export class CreateAdminUserDto {
  @IsString()
  fullName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsOptional()
  @IsEnum(['admin', 'user', 'supplier', 'garage'])
  role?: AppRole;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
