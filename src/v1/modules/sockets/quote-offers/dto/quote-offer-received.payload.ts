import { IsISO8601, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class QuoteOfferReceivedPayload {
  @IsUUID()
  offerId!: string;

  @IsUUID()
  quoteRequestId!: string;

  @IsUUID()
  userId!: string;

  @IsNumber()
  price!: number;

  @IsString()
  supplierName!: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsISO8601()
  createdAt!: string;
}
