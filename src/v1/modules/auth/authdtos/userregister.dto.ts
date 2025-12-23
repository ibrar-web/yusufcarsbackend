import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import * as userEntity from '../../../entities/user.entity';

export class UserRegisterDto {
  @IsEnum(['admin', 'user', 'supplier', 'garage'])
  role: userEntity.AppRole;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  phone: string;

  @IsString()
  postCode: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsBoolean()
  marketingOptIn?: boolean;
}

export class AdminRegisterDto {
  @IsEnum(['admin'])
  role: userEntity.AppRole = 'admin'; // default value

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  phone: string;

  @IsString()
  postCode: string;

  @IsString()
  @MinLength(6)
  password: string;
}
