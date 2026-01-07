import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../admin/decorators/current-user.decorator';
import { UserRequestQuoteService } from './request-quote.service';
import { CreateRequestQuoteDto } from './dto/create-request-quote.dto';
import { QuoteRequest } from '../../../entities/quotes/quote-request.entity';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import type { Express } from 'express';

type QuoteRequestStatus = QuoteRequest['status'];

@Controller('user/quote/request')
@UseGuards(AuthGuard, RolesGuard)
@Roles('user')
export class UserRequestQuoteController {
  constructor(private readonly requestQuotes: UserRequestQuoteService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: QuoteRequestStatus,
  ) {
    return this.requestQuotes.list(user.sub, status);
  }

  @Get(':id')
  detail(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.requestQuotes.detail(user.sub, id);
  }

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'images', maxCount: 6 }], {
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateRequestQuoteDto,
    @UploadedFiles()
    files?: {
      images?: Express.Multer.File[];
    },
  ) {
    return this.requestQuotes.create(user.sub, dto, files?.images);
  }
}
