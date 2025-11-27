import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class ChatMessageSenderPayload {
  @IsUUID()
  id!: string;

  @IsString()
  email!: string;

  @IsString()
  fullName!: string;

  @IsOptional()
  @IsString()
  firstName?: string | null;

  @IsString()
  role!: string;

  @IsBoolean()
  isActive!: boolean;

  @IsOptional()
  @IsString()
  suspensionReason?: string | null;

  @IsDateString()
  createdAt!: string;

  @IsOptional()
  @IsString()
  postCode?: string | null;
}

class ChatMessageBodyPayload {
  @IsUUID()
  id!: string;

  @IsUUID()
  senderId!: string;

  @IsString()
  content!: string;

  @IsBoolean()
  isRead!: boolean;

  @IsDateString()
  createdAt!: string;

  @IsOptional()
  @IsDateString()
  deletedAt?: string | null;

  @ValidateNested()
  @Type(() => ChatMessageSenderPayload)
  sender!: ChatMessageSenderPayload;
}

export class ChatMessagePayload {
  @IsUUID()
  messageId!: string;

  @IsUUID()
  chatId!: string;

  @IsUUID()
  senderId!: string;

  @IsEnum(['user', 'supplier'] as const, {
    message: 'senderRole must be user or supplier',
  })
  senderRole!: 'user' | 'supplier';

  @IsUUID()
  recipientId!: string;

  @IsString()
  content!: string;

  @IsDateString()
  createdAt!: string;

  @ValidateNested()
  @Type(() => ChatMessageBodyPayload)
  message!: ChatMessageBodyPayload;
}
