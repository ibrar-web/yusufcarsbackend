import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Supplier } from '../../../entities/supplier.entity';
import { AdminSuppliersController } from './suppliers.controller';
import { AdminSuppliersService } from './suppliers.service';
import { JwtCookieGuard } from '../guards/jwt-cookie.guard';
import { RolesGuard } from '../guards/roles.guard';
import { JwtCookieStrategy } from '../strategies/jwt-cookie.strategy';
import { JoseService } from '../../auth/jose.service';

@Module({
  imports: [TypeOrmModule.forFeature([Supplier])],
  controllers: [AdminSuppliersController],
  providers: [AdminSuppliersService, JwtCookieGuard, RolesGuard, JwtCookieStrategy, JoseService],
})
export class AdminSuppliersModule {}
