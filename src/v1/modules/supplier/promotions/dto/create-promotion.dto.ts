import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { DiscountType } from '../../../../entities/supplier-promotion.entity';

export class CreatePromotionDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(DiscountType)
  discountType!: DiscountType;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  discountValue!: number;

  @IsDateString()
  startsAt!: string;

  @IsDateString()
  endsAt!: string;

  @IsUUID()
  @IsOptional()
  serviceCategoryId?: string;

  @IsUUID()
  @IsOptional()
  serviceItemId?: string;
}
