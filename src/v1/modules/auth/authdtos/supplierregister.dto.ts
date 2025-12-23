import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsArray,
  IsNotEmpty,
} from 'class-validator';
import { Transform } from 'class-transformer';
import * as userEntity from '../../../entities/user.entity';

export class SupplierRegisterDto {
  @IsEnum(['admin', 'user', 'supplier', 'garage'])
  role?: userEntity.AppRole;

  @IsString()
  @IsNotEmpty()
  businessName!: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsString()
  @IsNotEmpty()
  tradingAs!: string;

  @IsString()
  @IsNotEmpty()
  businessType!: string;

  @IsString()
  @IsNotEmpty()
  vatNumber!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsString()
  @IsNotEmpty()
  addressLine1!: string;

  @IsOptional()
  @IsString()
  addressLine2?: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsString()
  @IsNotEmpty()
  city!: string;

  @IsString()
  @IsNotEmpty()
  postCode!: string;

  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  termsAccepted!: boolean;

  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  gdprConsent!: boolean;

  @Transform(({ value }): string[] | undefined => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    const raw = Array.isArray(value) ? value : [value];
    const normalized = raw
      .map((entry) => (typeof entry === 'string' ? entry : String(entry)))
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
    return normalized.length ? normalized : undefined;
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  marketingOptIn?: boolean;
}
