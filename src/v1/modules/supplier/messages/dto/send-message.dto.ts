import { IsString, IsUUID } from 'class-validator';

export class SendMessageDto {
  @IsUUID()
  userId!: string;

  @IsString()
  message!: string;
}
