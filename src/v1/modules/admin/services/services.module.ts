import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceCategory } from '../../../entities/services/service-category.entity';
import { ServiceSubcategory } from '../../../entities/services/service-subcategory.entity';
import { ServiceItem } from '../../../entities/services/service-item.entity';
import { AdminServicesController } from './services.controller';
import { AdminServicesService } from './services.service';
import { JwtCookieGuard } from '../guards/jwt-cookie.guard';
import { RolesGuard } from '../guards/roles.guard';
import { JwtCookieStrategy } from '../strategies/jwt-cookie.strategy';
import { JoseService } from '../../auth/jose.service';
import { S3Service } from '../../../common/aws/s3.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ServiceCategory,
      ServiceSubcategory,
      ServiceItem,
    ]),
  ],
  controllers: [AdminServicesController],
  providers: [
    AdminServicesService,
    JwtCookieGuard,
    RolesGuard,
    JwtCookieStrategy,
    JoseService,
    S3Service,
  ],
})
export class AdminServicesModule {}
