import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import * as userEntity from '../../users/user.entity';

export class UserRegisterDto {
  @IsEnum(['admin', 'user', 'supplier', 'garage'])
  role?: userEntity.AppRole;
  @IsString()
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  phone: string;

  @IsString()
  postcode: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsBoolean()
  marketingOptIn?: boolean;
}
