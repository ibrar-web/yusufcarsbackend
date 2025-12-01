import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../admin/decorators/current-user.decorator';
import { UserRequestQuoteService } from './request-quote.service';
import { CreateRequestQuoteDto } from './dto/create-request-quote.dto';
import { QuoteRequest } from '../../../entities/quotes/quote-request.entity';

type QuoteRequestStatus = QuoteRequest['status'];

@Controller('user/quotes')
@UseGuards(AuthGuard, RolesGuard)
@Roles('user')
export class UserRequestQuoteController {
  constructor(private readonly requestQuotes: UserRequestQuoteService) {}

  @Get()
  list(@CurrentUser() user: any, @Query('status') status?: QuoteRequestStatus) {
    return this.requestQuotes.list(user.sub, status);
  }

  @Get(':id')
  detail(@CurrentUser() user: any, @Param('id') id: string) {
    return this.requestQuotes.detail(user.sub, id);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateRequestQuoteDto) {
    return this.requestQuotes.create(user.sub, dto);
  }
}
