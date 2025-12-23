import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Blog } from '../../entities/blog.entity';
import { Tag } from '../../entities/tag.entity';
import { BlogService } from './blog.service';
import { BlogController } from './blog.controller';
import { User } from '../../entities/user.entity';
import { Supplier } from '../../entities/supplier.entity';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JoseService } from '../auth/jose.service';
import { KycDocsService } from '../../common/aws/kyc-docs.service';
import { S3Service } from '../../common/aws/s3.service';

@Module({
  imports: [TypeOrmModule.forFeature([Blog, Tag, User, Supplier])],
  controllers: [BlogController],
  providers: [
    BlogService,
    AuthGuard,
    RolesGuard,
    JoseService,
    KycDocsService,
    S3Service,
  ],
  exports: [BlogService],
})
export class BlogModule {}
