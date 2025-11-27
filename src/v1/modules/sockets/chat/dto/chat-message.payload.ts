import { IsDateString, IsEnum, IsString, IsUUID } from 'class-validator';

export class ChatMessagePayload {
  @IsUUID()
  messageId!: string;

  @IsUUID()
  quoteRequestId!: string;

  @IsUUID()
  senderId!: string;

  @IsEnum(['user', 'supplier'] as const, {
    message: 'senderRole must be user or supplier',
  })
  senderRole!: 'user' | 'supplier';

  @IsUUID()
  recipientId!: string;

  @IsString()
  body!: string;

  @IsDateString()
  createdAt!: string;

  @IsEnum(['user-to-supplier', 'supplier-to-user'] as const)
  direction!: 'user-to-supplier' | 'supplier-to-user';
}
