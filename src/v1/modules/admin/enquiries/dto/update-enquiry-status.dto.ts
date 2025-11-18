import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateEnquiryStatusDto {
  @IsEnum(['pending', 'expired', 'completed'])
  status!: 'pending' | 'expired' | 'completed';

  @IsOptional()
  @IsString()
  internalNotes?: string;
}
