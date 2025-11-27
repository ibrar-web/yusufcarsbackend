import { IsString, IsUUID } from 'class-validator';

export class SendUserMessageDto {
  @IsUUID()
  chatId!: string;

  @IsString()
  message!: string;
}
