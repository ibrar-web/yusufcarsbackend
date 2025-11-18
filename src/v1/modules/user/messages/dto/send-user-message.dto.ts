import { IsString } from 'class-validator';

export class SendUserMessageDto {
  @IsString()
  quoteRequestId!: string;

  @IsString()
  supplierId!: string;

  @IsString()
  body!: string;
}
