import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { SupplierApprovalStatus } from '../../../../entities/supplier.entity';
import { UserStatus } from '../../../../entities/user.entity';

export class UpdateAdminSupplierDto {
  @IsOptional()
  @IsString()
  businessName?: string;

  @IsOptional()
  @IsString()
  tradingAs?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsEnum(SupplierApprovalStatus)
  approvalStatus?: SupplierApprovalStatus;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];
}
