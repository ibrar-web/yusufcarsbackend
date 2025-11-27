import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { UserMessagesService } from './user-messages.service';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../admin/decorators/current-user.decorator';
import { SendUserMessageDto } from './dto/send-user-message.dto';

@Controller('user/chat')
@UseGuards(AuthGuard, RolesGuard)
@Roles('user')
export class UserMessagesController {
  constructor(private readonly messages: UserMessagesService) {}

  @Get()
  list(@CurrentUser() user: any, @Query('supplierId') supplierId: string) {
    return this.messages.list(user.sub, supplierId);
  }

  @Get('list')
  listChats(
    @CurrentUser() user: any,
    @Query('supplierId') supplierId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.messages.listChats(user.sub, {
      supplierId,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Post()
  send(@CurrentUser() user: any, @Body() dto: SendUserMessageDto) {
    return this.messages.send(user.sub, dto);
  }
}
