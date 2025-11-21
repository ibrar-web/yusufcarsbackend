import { IsEnum } from 'class-validator';
import { InquiryStatus } from '../../../../entities/inquiries.entity';

export class UpdateEnquiryStatusDto {
  @IsEnum(InquiryStatus)
  status!: InquiryStatus;
}
