import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuoteRequest } from '../../../entities/quote-request.entity';
import { Quote } from '../../../entities/quote-offers.entity';
import { UserQuotesController } from './user-quotes.controller';
import { UserQuotesService } from './user-quotes.service';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { JoseService } from '../../auth/jose.service';

@Module({
  imports: [TypeOrmModule.forFeature([QuoteRequest, Quote])],
  controllers: [UserQuotesController],
  providers: [UserQuotesService, AuthGuard, RolesGuard, JoseService],
})
export class UserQuotesModule {}
