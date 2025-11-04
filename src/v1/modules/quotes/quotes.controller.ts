import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('/api/v1/quotes')
@UseGuards(AuthGuard, RolesGuard)
export class QuotesController {
  constructor(private readonly quotes: QuotesService) {}

  @Post('request')
  @Roles('user')
  createRequest(@Req() req: any, @Body() body: any) {
    return this.quotes.createRequest(req.user.sub, body);
  }

  @Post('respond')
  @Roles('supplier')
  respond(@Req() req: any, @Body() body: { quoteRequestId: string; price: number; deliveryTime: string }) {
    return this.quotes.respond(req.user.sub, body);
  }

  @Post(':id/accept')
  @Roles('user')
  accept(@Req() req: any, @Param('id') id: string) {
    return this.quotes.accept(req.user.sub, id);
  }

  @Get('my-requests')
  @Roles('user')
  myRequests(@Req() req: any) {
    return this.quotes.myRequests(req.user.sub);
  }
}


