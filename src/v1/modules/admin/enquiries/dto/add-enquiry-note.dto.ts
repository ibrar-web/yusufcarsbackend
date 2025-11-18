import { IsString } from 'class-validator';

export class AddEnquiryNoteDto {
  @IsString()
  note!: string;
}
