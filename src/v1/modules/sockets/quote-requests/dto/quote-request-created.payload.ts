import { IsArray, IsISO8601, IsOptional, IsString, IsUUID } from 'class-validator';

export class QuoteRequestCreatedPayload {
  @IsUUID()
  requestId!: string;

  @IsUUID()
  userId!: string;

  @IsOptional()
  @IsString()
  postCode?: string | null;

  @IsArray()
  @IsString({ each: true })
  serviceCategories!: string[];

  @IsISO8601()
  createdAt!: string;
}
