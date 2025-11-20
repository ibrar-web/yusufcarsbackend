import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Quote } from '../../../entities/quote-offers.entity';
import { UserOrdersController } from './user-orders.controller';
import { UserOrdersService } from './user-orders.service';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { JoseService } from '../../auth/jose.service';

@Module({
  imports: [TypeOrmModule.forFeature([Quote])],
  controllers: [UserOrdersController],
  providers: [UserOrdersService, AuthGuard, RolesGuard, JoseService],
})
export class UserOrdersModule {}
