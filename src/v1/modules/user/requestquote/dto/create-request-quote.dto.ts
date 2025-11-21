import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateRequestQuoteDto {
  @IsString()
  @IsNotEmpty()
  maker!: string;

  @IsString()
  @IsNotEmpty()
  model!: string;

  @IsOptional()
  @IsString()
  year?: string;

  @IsOptional()
  @IsString()
  fuelType?: string;

  @IsOptional()
  @IsString()
  engineSize?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
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
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  requireFitment?: boolean;

  @IsOptional()
  @IsEnum(['local', 'national'])
  requestType?: 'local' | 'national';

  @IsOptional()
  @IsString()
  expiresAt?: string;
}
