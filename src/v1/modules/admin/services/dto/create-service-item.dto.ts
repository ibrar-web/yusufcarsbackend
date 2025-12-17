import {
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  IsObject,
} from 'class-validator';

export class CreateServiceItemDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(150)
  slug!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
