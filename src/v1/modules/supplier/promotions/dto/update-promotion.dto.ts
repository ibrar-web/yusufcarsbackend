import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { DiscountType } from '../../../../entities/supplier-promotion.entity';

export class UpdatePromotionDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(DiscountType)
  @IsOptional()
  discountType?: DiscountType;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  discountValue?: number;

  @IsDateString()
  @IsOptional()
  startsAt?: string;

  @IsDateString()
  @IsOptional()
  endsAt?: string;

  @IsUUID()
  @IsOptional()
  serviceCategoryId?: string;

  @IsUUID()
  @IsOptional()
  serviceItemId?: string;
}
