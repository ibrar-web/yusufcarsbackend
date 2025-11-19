import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { UserMessagesService } from './user-messages.service';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../admin/decorators/current-user.decorator';
import { SendUserMessageDto } from './dto/send-user-message.dto';

@Controller('user/messages')
@UseGuards(AuthGuard, RolesGuard)
@Roles('user')
export class UserMessagesController {
  constructor(private readonly messages: UserMessagesService) {}

  @Get()
  list(
    @CurrentUser() user: any,
    @Query('quoteRequestId') quoteRequestId?: string,
  ) {
    return this.messages.list(user.sub, quoteRequestId);
  }

  @Post()
  send(@CurrentUser() user: any, @Body() dto: SendUserMessageDto) {
    return this.messages.send(user.sub, dto);
  }
}
