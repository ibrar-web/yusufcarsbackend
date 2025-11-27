import { IsISO8601, IsOptional, IsString, IsUUID } from 'class-validator';

export class QuoteOfferUpdatedPayload {
  @IsUUID()
  offerId!: string;

  @IsUUID()
  userId!: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsISO8601()
  updatedAt!: string;
}
