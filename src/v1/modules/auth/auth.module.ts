import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JoseService } from './jose.service';
import { User } from '../../entities/user.entity';
import { Supplier } from '../../entities/supplier.entity';
import { SupplierDocument } from '../../entities/supplier-document.entity';
import { SupplierDocumentType } from '../../entities/supplier-document-type.entity';
import { KycDocsService } from '../../common/aws/kyc-docs.service';
import { S3Service } from '../../common/aws/s3.service';
import { GoogleGeocodingService } from '../../common/geocoding/google-geocoding.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Supplier,
      SupplierDocument,
      SupplierDocumentType,
    ]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JoseService,
    KycDocsService,
    S3Service,
    GoogleGeocodingService,
  ],
  exports: [AuthService],
})
export class AuthModule {}
