import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Supplier } from '../../../entities/supplier.entity';
import { User } from '../../../entities/user.entity';
import { SupplierProfileController } from './profile.controller';
import { SupplierProfileService } from './profile.service';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { JoseService } from '../../auth/jose.service';

@Module({
  imports: [TypeOrmModule.forFeature([Supplier, User])],
  controllers: [SupplierProfileController],
  providers: [SupplierProfileService, AuthGuard, RolesGuard, JoseService],
})
export class SupplierProfileModule {}
