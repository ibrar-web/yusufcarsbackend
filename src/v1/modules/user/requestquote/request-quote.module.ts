import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuoteRequest } from '../../../entities/quote-request.entity';
import { User } from '../../../entities/user.entity';
import { UserRequestQuoteController } from './request-quote.controller';
import { UserRequestQuoteService } from './request-quote.service';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { JoseService } from '../../auth/jose.service';
import { QuoteRequestExpiryService } from './quote-request-expiry.service';

@Module({
  imports: [TypeOrmModule.forFeature([QuoteRequest, User])],
  controllers: [UserRequestQuoteController],
  providers: [
    UserRequestQuoteService,
    QuoteRequestExpiryService,
    AuthGuard,
    RolesGuard,
    JoseService,
  ],
})
export class UserRequestQuoteModule {}
