import { IsString } from 'class-validator';

export class AssignEnquiryDto {
  @IsString()
  assignedTo!: string;
}
