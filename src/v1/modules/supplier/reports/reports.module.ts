import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../../../entities/quotes/order.entity';
import { User } from '../../../entities/user.entity';
import { SupplierReportsController } from './reports.controller';
import { SupplierReportsService } from './reports.service';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { JoseService } from '../../auth/jose.service';

@Module({
  imports: [TypeOrmModule.forFeature([Order, User])],
  controllers: [SupplierReportsController],
  providers: [SupplierReportsService, AuthGuard, RolesGuard, JoseService],
})
export class SupplierReportsModule {}
