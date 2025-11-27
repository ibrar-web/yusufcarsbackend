import { IsString, IsUUID } from 'class-validator';

export class SendUserMessageDto {
  @IsUUID()
  supplierId!: string;

  @IsString()
  message!: string;
}
