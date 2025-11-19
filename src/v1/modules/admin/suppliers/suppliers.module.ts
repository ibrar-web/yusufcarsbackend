import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Supplier } from '../../../entities/supplier.entity';
import { AdminSuppliersController } from './suppliers.controller';
import { AdminSuppliersService } from './suppliers.service';
import { JwtCookieGuard } from '../guards/jwt-cookie.guard';
import { RolesGuard } from '../guards/roles.guard';
import { JwtCookieStrategy } from '../strategies/jwt-cookie.strategy';
import { JoseService } from '../../auth/jose.service';
import { User } from 'src/v1/entities/user.entity';
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
  controllers: [AdminSuppliersController],
  providers: [
    AdminSuppliersService,
    JwtCookieGuard,
    RolesGuard,
    JwtCookieStrategy,
    JoseService,
    KycDocsService,
    S3Service,
  ],
})
export class AdminSuppliersModule {}
