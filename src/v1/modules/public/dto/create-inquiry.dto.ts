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

type CandidateKeys = 'message' | 'Message' | 'msg' | 'Msg' | 'body';

const safeGet = (
  obj: unknown,
  key: CandidateKeys,
): string | number | boolean | undefined => {
  if (!obj || typeof obj !== 'object') return undefined;
  const candidate = (obj as Record<string, unknown>)[key];
  if (
    typeof candidate === 'string' ||
    typeof candidate === 'number' ||
    typeof candidate === 'boolean'
  ) {
    return candidate;
  }
  return undefined;
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
  firstName!: string;

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

  @Transform(({ value, obj }) =>
    sanitizeText(
      value ??
        safeGet(obj, 'message') ??
        safeGet(obj, 'Message') ??
        safeGet(obj, 'msg') ??
        safeGet(obj, 'Msg') ??
        safeGet(obj, 'body') ??
        '',
    ).trim(),
  )
  @IsString()
  @IsNotEmpty()
  content!: string;

  @Transform(({ value }) => toBoolean(value))
  @IsOptional()
  @IsBoolean()
  contact?: boolean;
}
