import { IsDateString, IsEnum, IsString, IsUUID } from 'class-validator';

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
}
