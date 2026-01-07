import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuoteRequest } from '../../../entities/quotes/quote-request.entity';
import { User } from '../../../entities/user.entity';
import { Supplier } from '../../../entities/supplier.entity';
import { SupplierQuoteNotification } from '../../../entities/quotes/supplier-quote-notification.entity';
import { ServiceItem } from '../../../entities/services/service-item.entity';
import { UserRequestQuoteController } from './request-quote.controller';
import { UserRequestQuoteService } from './request-quote.service';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { JoseService } from '../../auth/jose.service';
import { QuoteRequestExpiryService } from './quote-request-expiry.service';
import { QuoteRequestNotificationService } from './quote-request-notification.service';
import { GoogleGeocodingService } from '../../../common/geocoding/google-geocoding.service';
import { S3Service } from '../../../common/aws/s3.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      QuoteRequest,
      User,
      Supplier,
      SupplierQuoteNotification,
      ServiceItem,
    ]),
  ],
  controllers: [UserRequestQuoteController],
  providers: [
    UserRequestQuoteService,
    QuoteRequestExpiryService,
    QuoteRequestNotificationService,
    AuthGuard,
    RolesGuard,
    JoseService,
    GoogleGeocodingService,
    S3Service,
  ],
})
export class UserRequestQuoteModule {}
