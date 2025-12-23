import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Supplier } from '../../../entities/supplier.entity';
import { User } from '../../../entities/user.entity';
import { SupplierProfileController } from './profile.controller';
import { SupplierProfileService } from './profile.service';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { JoseService } from '../../auth/jose.service';
import { SupplierDocument } from '../../../entities/supplier-document.entity';
import { SupplierDocumentType } from '../../../entities/supplier-document-type.entity';
import { KycDocsService } from '../../../common/aws/kyc-docs.service';
import { S3Service } from '../../../common/aws/s3.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Supplier,
      User,
      SupplierDocument,
      SupplierDocumentType,
    ]),
  ],
  controllers: [SupplierProfileController],
  providers: [
    SupplierProfileService,
    AuthGuard,
    RolesGuard,
    JoseService,
    KycDocsService,
    S3Service,
  ],
})
export class SupplierProfileModule {}
