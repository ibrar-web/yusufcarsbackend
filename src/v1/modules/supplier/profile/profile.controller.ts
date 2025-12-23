import {
  Body,
  Controller,
  Get,
  Put,
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
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import type { UploadedFile } from '../../../common/aws/s3.service';

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
      companyRegDoc?: UploadedFile[];
      insuranceDoc?: UploadedFile[];
    },
  ) {
    const docs: Record<string, UploadedFile | undefined> = {};
    if (files?.companyRegDoc?.[0]) {
      docs['company_registration'] = files.companyRegDoc[0];
    }
    if (files?.insuranceDoc?.[0]) {
      docs['insurance_certificate'] = files.insuranceDoc[0];
    }
    const payload =
      Object.keys(docs).length > 0 ? docs : undefined;
    return this.profile.updateProfile(user.sub, dto, payload);
  }

  @Put('password')
  updatePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateSupplierPasswordDto,
  ) {
    return this.profile.updatePassword(user.sub, dto);
  }
}
