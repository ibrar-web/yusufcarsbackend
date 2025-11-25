import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuoteRequest } from '../../../entities/quote-request.entity';
import { UserNotificationsController } from './user-quotes.controller';
import { UserNotificationsService } from './user-quotes.service';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { JoseService } from '../../auth/jose.service';

@Module({
  imports: [TypeOrmModule.forFeature([QuoteRequest])],
  controllers: [UserNotificationsController],
  providers: [UserNotificationsService, AuthGuard, RolesGuard, JoseService],
})
export class UserNotificationsModule {}
