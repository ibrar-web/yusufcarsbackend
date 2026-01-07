import {
  Body,
  Controller,
  Get,
  Put,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { SupplierProfileService } from './profile.service';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import {
  UpdateSupplierFlatDto,
  UpdateSupplierPasswordDto,
} from './profile.dto';
import { CurrentUser } from '../../admin/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user';
import {
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express';
import type { UploadedFile as AwsUploadedFile } from '../../../common/aws/s3.service';
import type { Express } from 'express';

@Controller('supplier/profile')
@UseGuards(AuthGuard, RolesGuard)
@Roles('supplier')
export class SupplierProfileController {
  constructor(private readonly profile: SupplierProfileService) {}

  @Get()
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.profile.getProfile(user.sub);
  }

  @Put()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'companyRegDoc', maxCount: 1 },
      { name: 'insuranceDoc', maxCount: 1 },
    ]),
  )
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateSupplierFlatDto,
    @UploadedFiles()
    files?: {
      companyRegDoc?: AwsUploadedFile[];
      insuranceDoc?: AwsUploadedFile[];
    },
  ) {
    const docs: Record<string, AwsUploadedFile | undefined> = {};
    if (files?.companyRegDoc?.[0]) {
      docs['company_registration'] = files.companyRegDoc[0];
    }
    if (files?.insuranceDoc?.[0]) {
      docs['insurance_certificate'] = files.insuranceDoc[0];
    }
    const payload = Object.keys(docs).length > 0 ? docs : undefined;
    return this.profile.updateProfile(user.sub, dto, payload);
  }

  @Put('password')
  updatePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateSupplierPasswordDto,
  ) {
    return this.profile.updatePassword(user.sub, dto);
  }

  @Put('avatar')
  @UseInterceptors(FileInterceptor('image'))
  updateAvatar(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.profile.updateProfileImage(user.sub, file);
  }

  @Put('main-category-image')
  @UseInterceptors(FileInterceptor('image'))
  updateMainCategoryImage(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.profile.updateMainCategoryImage(user.sub, file);
  }
}
