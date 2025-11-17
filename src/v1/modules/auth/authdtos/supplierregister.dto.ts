import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import * as userEntity from '../../users/user.entity';

export class SupplierRegisterDto {
  @IsEnum(['admin', 'user', 'supplier', 'garage'])
  role?: userEntity.AppRole;

  @IsString()
  businessName: string;

  @IsOptional()
  @IsString()
  tradingAs?: string;

  @IsOptional()
  @IsString()
  businessType?: string;

  @IsOptional()
  @IsString()
  vatNumber?: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  addressLine1?: string;

  @IsOptional()
  @IsString()
  addressLine2?: string;

  @IsOptional()
  @IsString()
  town: string;

  @IsOptional()
  @IsString()
  county: string;

  @IsOptional()
  @IsString()
  postCode: string;

  @IsOptional()
  @IsString()
  phone: string;

  // USER DATA ALSO REQUIRED
  @IsString()
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsBoolean()
  marketingOptIn?: boolean;
}
