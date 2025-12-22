import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inquiries } from '../../../entities/inquiries.entity';
import { AdminEnquiriesController } from './inquiries.controller';
import { AdminEnquiriesService } from './inquiries.service';
import { JwtCookieGuard } from '../guards/jwt-cookie.guard';
import { RolesGuard } from '../guards/roles.guard';
import { JwtCookieStrategy } from '../strategies/jwt-cookie.strategy';
import { JoseService } from '../../auth/jose.service';
import { S3Service } from '../../../common/aws/s3.service';

@Module({
  imports: [TypeOrmModule.forFeature([Inquiries])],
  controllers: [AdminEnquiriesController],
  providers: [
    AdminEnquiriesService,
    JwtCookieGuard,
    RolesGuard,
    JwtCookieStrategy,
    JoseService,
    S3Service,
  ],
})
export class AdminEnquiriesModule {}
