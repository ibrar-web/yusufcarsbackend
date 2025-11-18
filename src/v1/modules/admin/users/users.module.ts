import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../../entities/user.entity';
import { AdminUsersService } from './users.service';
import { AdminUsersController } from './users.controller';
import { JwtCookieGuard } from '../guards/jwt-cookie.guard';
import { RolesGuard } from '../guards/roles.guard';
import { JwtCookieStrategy } from '../strategies/jwt-cookie.strategy';
import { JoseService } from '../../auth/jose.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [AdminUsersController],
  providers: [AdminUsersService, JwtCookieGuard, RolesGuard, JwtCookieStrategy, JoseService],
})
export class AdminUsersModule {}
