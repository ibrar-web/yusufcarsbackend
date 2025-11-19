import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class StatusReasonDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason!: string;
}
