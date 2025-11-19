import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JoseService } from './jose.service';
import { User } from '../../entities/user.entity';
import { Supplier } from '../../entities/supplier.entity';
import { SupplierDocument } from '../../entities/supplier-document.entity';
import { KycDocsService } from '../../common/aws/kyc-docs.service';
import { S3Service } from '../../common/aws/s3.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Supplier, SupplierDocument])],
  controllers: [AuthController],
  providers: [AuthService, JoseService, KycDocsService, S3Service],
  exports: [AuthService],
})
export class AuthModule {}
