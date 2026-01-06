import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../../entities/user.entity';
import { UserProfileController } from './profile.controller';
import { UserProfileService } from './profile.service';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { JoseService } from '../../auth/jose.service';
import { GoogleGeocodingService } from '../../../common/geocoding/google-geocoding.service';
import { S3Service } from '../../../common/aws/s3.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UserProfileController],
  providers: [
    UserProfileService,
    AuthGuard,
    RolesGuard,
    JoseService,
    GoogleGeocodingService,
    S3Service,
  ],
})
export class UserProfileModule {}
