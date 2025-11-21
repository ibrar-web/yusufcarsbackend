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

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price!: number;

  @IsString()
  @IsNotEmpty()
  deliveryTime!: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
