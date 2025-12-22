import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inquiries } from '../../entities/inquiries.entity';
import { PublicInquiriesController } from './public.controller';
import { PublicInquiriesService } from './public.service';
import { S3Service } from '../../common/aws/s3.service';

@Module({
  imports: [TypeOrmModule.forFeature([Inquiries])],
  controllers: [PublicInquiriesController],
  providers: [PublicInquiriesService, S3Service],
})
export class PublicModule {}
