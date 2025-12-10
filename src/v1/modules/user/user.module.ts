import { Module } from '@nestjs/common';
import { UserMessagesModule } from './messages/user-messages.module';
import { UserOrdersModule } from './orders/user-orders.module';
import { UserSettingsModule } from './settings/user-settings.module';
import { UserQuotesModule } from './quotesoffer/user-quotes.module';
import { UserRequestQuoteModule } from './requestquote/request-quote.module';

@Module({
  imports: [
    UserMessagesModule,
    UserOrdersModule,
    UserSettingsModule,
    UserQuotesModule,
    UserRequestQuoteModule,
  ],
})
export class UserModule {}

