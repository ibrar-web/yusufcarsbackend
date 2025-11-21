import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { SupplierQuoteOffersService } from './quote-offers.service';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../admin/decorators/current-user.decorator';
import { CreateQuoteOfferDto } from './dto/create-quote-offer.dto';

@Controller('supplier/quote-offers')
@UseGuards(AuthGuard, RolesGuard)
@Roles('supplier')
export class SupplierQuoteOffersController {
  constructor(private readonly quoteOffers: SupplierQuoteOffersService) {}

  @Get('requests')
  listAvailable(@CurrentUser() user: any) {
    return this.quoteOffers.listAvailableRequests(user.sub);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateQuoteOfferDto) {
    return this.quoteOffers.createOffer(user.sub, dto);
  }
}
