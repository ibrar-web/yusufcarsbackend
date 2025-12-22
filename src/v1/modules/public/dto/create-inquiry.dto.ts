import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { UrgencyLevel } from '../../../entities/inquiries.entity';

const sanitizeText = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return '';
};

const toBoolean = (value: unknown): boolean | undefined => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return undefined;
    if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
    if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  }
  return undefined;
};

export class CreateInquiryDto {
  @Transform(({ value }) => sanitizeText(value).trim())
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  fullName!: string;

  @Transform(({ value }) => sanitizeText(value).trim())
  @IsEmail()
  @MaxLength(180)
  email!: string;

  @Transform(({ value }) => sanitizeText(value).trim())
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  subject!: string;

  @Transform(({ value }) => {
    const normalized = sanitizeText(value).toLowerCase();
    return normalized ? (normalized as UrgencyLevel) : undefined;
  })
  @IsEnum(UrgencyLevel)
  @IsOptional()
  urgency?: UrgencyLevel;

  @Transform(({ value, obj }) => {
    const source =
      value ??
      obj?.message ??
      obj?.Message ??
      obj?.msg ??
      obj?.Msg ??
      obj?.body ??
      '';
    return sanitizeText(source).trim();
  })
  @IsString()
  @IsNotEmpty()
  content!: string;

  @Transform(({ value }) => toBoolean(value))
  @IsOptional()
  @IsBoolean()
  contact?: boolean;
}
