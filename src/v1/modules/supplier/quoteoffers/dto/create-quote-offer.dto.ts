import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateQuoteOfferDto {
  @IsUUID()
  quoteRequestId!: string;

  @IsString()
  @IsNotEmpty()
  partName!: string;

  @IsString()
  @IsNotEmpty()
  brand!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price!: number;

  @IsString()
  @IsNotEmpty()
  estimatedTime!: string;

  @IsOptional()
  @IsString()
  partCondition?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsUUID()
  promotionId?: string;
}
