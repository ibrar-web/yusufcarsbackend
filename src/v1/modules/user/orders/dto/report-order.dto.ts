import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ReportOrderDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  cancellationReason!: string;
}
