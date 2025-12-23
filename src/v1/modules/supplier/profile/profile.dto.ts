import {
  IsOptional,
  IsString,
  IsEmail,
  IsBoolean,
  MinLength,
} from 'class-validator';

export class UpdateSupplierFlatDto {
  // ===== USER (profile) =====
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  postCode?: string;

  // ===== SUPPLIER (business) =====
  @IsOptional()
  @IsString()
  businessName?: string;

  @IsOptional()
  @IsString()
  tradingAs?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  addressLine1?: string;

  @IsOptional()
  @IsString()
  addressLine2?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsBoolean()
  marketingOptIn?: boolean;
}

export class UpdateSupplierPasswordDto {
  @IsString()
  @MinLength(6)
  currentPassword!: string;

  @IsString()
  @MinLength(6)
  newPassword!: string;
}
