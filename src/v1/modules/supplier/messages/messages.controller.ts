import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SupplierMessagesService } from './messages.service';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { SendMessageDto } from './dto/send-message.dto';
import { CurrentUser } from '../../admin/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user';

@Controller('supplier/chat')
@UseGuards(AuthGuard, RolesGuard)
@Roles('supplier')
export class SupplierMessagesController {
  constructor(private readonly messages: SupplierMessagesService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query('userId') userIdParam?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = this.requireUserId(userIdParam);
    return this.messages.list(user.sub, userId, {
      page: this.parseQueryNumber(page),
      limit: this.parseQueryNumber(limit),
    });
  }

  @Get('list')
  listChats(
    @CurrentUser() user: AuthenticatedUser,
    @Query('userId') userIdParam?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.messages.listChats(user.sub, {
      userId: this.normalizeUserId(userIdParam),
      page: this.parseQueryNumber(page),
      limit: this.parseQueryNumber(limit),
    });
  }

  @Post()
  send(@CurrentUser() user: AuthenticatedUser, @Body() dto: SendMessageDto) {
    return this.messages.send(user.sub, dto);
  }

  private parseQueryNumber(value?: string): number | undefined {
    if (typeof value !== 'string' || !value.trim()) return undefined;
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  }

  private requireUserId(userId?: string): string {
    const normalized =
      typeof userId === 'string' && userId.trim().length
        ? userId.trim()
        : undefined;
    if (!normalized) {
      throw new BadRequestException('userId query parameter is required');
    }
    return normalized;
  }

  private normalizeUserId(userId?: string): string | undefined {
    return typeof userId === 'string' && userId.trim().length
      ? userId.trim()
      : undefined;
  }
}
