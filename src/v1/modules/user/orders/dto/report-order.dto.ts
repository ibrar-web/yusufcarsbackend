import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class ReportOrderDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  reason!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  details!: string;

  @IsOptional()
  @IsBoolean()
  cancelOrder?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  cancellationReason?: string;
}
