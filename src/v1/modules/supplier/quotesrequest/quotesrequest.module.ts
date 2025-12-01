import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuoteRequest } from '../../../entities/quotes/quote-request.entity';
import { Supplier } from '../../../entities/supplier.entity';
import { SupplierQuotesController } from './quotesrequest.controller';
import { SupplierQuotesService } from './quotesrequest.service';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { JoseService } from '../../auth/jose.service';

@Module({
  imports: [TypeOrmModule.forFeature([QuoteRequest, Supplier])],
  controllers: [SupplierQuotesController],
  providers: [SupplierQuotesService, AuthGuard, RolesGuard, JoseService],
})
export class SupplierQuotesModule {}
