import { IsDateString, IsUUID } from 'class-validator';

export class ChatDeliveredPayload {
  @IsUUID()
  messageId!: string;

  @IsUUID()
  recipientId!: string;

  @IsDateString()
  deliveredAt!: string;
}
