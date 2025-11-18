import { IsEnum, IsString } from 'class-validator';

export class SendMessageDto {
  @IsString()
  quoteRequestId!: string;

  @IsEnum(['supplier-to-user', 'user-to-supplier'])
  direction!: 'supplier-to-user' | 'user-to-supplier';

  @IsString()
  body!: string;
}
