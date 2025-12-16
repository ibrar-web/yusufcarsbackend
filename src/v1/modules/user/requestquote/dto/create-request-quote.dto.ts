import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import type { TransformFnParams } from 'class-transformer';

export class CreateRequestQuoteDto {
  @IsOptional()
  @IsString()
  model?: string;

  @IsString()
  @IsNotEmpty()
  make!: string;

  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @IsOptional()
  @IsString()
  taxStatus?: string;

  @IsOptional()
  @IsISO8601()
  taxDueDate?: string;

  @IsOptional()
  @IsString()
  motStatus?: string;

  @IsOptional()
  @Transform(({ value }: TransformFnParams) =>
    value !== undefined && value !== null ? String(value) : undefined,
  )
  @IsString()
  yearOfManufacture?: string;

  @IsOptional()
  @IsString()
  fuelType?: string;

  @IsOptional()
  @IsString()
  engineSize?: string;

  @IsOptional()
  @Transform(({ value }: TransformFnParams) =>
    value === undefined || value === null || value === ''
      ? undefined
      : Number(value),
  )
  @IsInt()
  engineCapacity?: number;

  @IsOptional()
  @Transform(({ value }: TransformFnParams) =>
    value === undefined || value === null || value === ''
      ? undefined
      : Number(value),
  )
  @IsInt()
  co2Emissions?: number;

  @IsOptional()
  @Transform(({ value }: TransformFnParams) => {
    if (Array.isArray(value)) {
      return value
        .map((item) =>
          typeof item === 'string' ? item.trim() : String(item ?? '').trim(),
        )
        .filter((item) => item.length > 0);
    }
    if (typeof value === 'string' && value.length > 0) {
      return value.split(',').map((item) => item.trim());
    }
    return undefined;
  })
  @IsArray()
  @IsString({ each: true })
  services?: string[];

  @IsOptional()
  @IsString()
  postcode?: string;

  @IsOptional()
  @Transform(
    ({ value }: TransformFnParams) => value === 'true' || value === true,
  )
  @IsBoolean()
  markedForExport?: boolean;

  @IsOptional()
  @IsString()
  colour?: string;

  @IsOptional()
  @IsString()
  typeApproval?: string;

  @IsOptional()
  @Transform(({ value }: TransformFnParams) =>
    value === undefined || value === null || value === ''
      ? undefined
      : Number(value),
  )
  @IsInt()
  revenueWeight?: number;

  @IsOptional()
  @IsISO8601()
  dateOfLastV5CIssued?: string;

  @IsOptional()
  @IsISO8601()
  motExpiryDate?: string;

  @IsOptional()
  @IsString()
  wheelplan?: string;

  @IsOptional()
  @IsString()
  monthOfFirstRegistration?: string;

  @IsEnum(['local', 'national'])
  requestType!: 'local' | 'national';

  @IsOptional()
  @IsString()
  expiresAt?: string;
}
