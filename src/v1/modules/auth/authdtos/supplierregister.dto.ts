import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsArray,
  IsNotEmpty,
  ArrayNotEmpty,
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

  @IsString()
  @IsNotEmpty()
  contactPostcode!: string;

  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  termsAccepted!: boolean;

  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  gdprConsent!: boolean;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  @Transform(({ value }) =>
    Array.isArray(value) ? value : value ? [value] : [],
  )
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  categories!: string[];

  // USER DATA ALSO REQUIRED
  @IsString()
  fullName: string;

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
