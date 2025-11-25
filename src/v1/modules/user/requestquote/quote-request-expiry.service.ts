import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuoteRequest } from '../../../entities/quote-request.entity';
import { QUOTE_REQUEST_LIFETIME_MS } from './request-quote.constants';

@Injectable()
export class QuoteRequestExpiryService implements OnModuleInit {
  private readonly logger = new Logger(QuoteRequestExpiryService.name);

  constructor(
    @InjectRepository(QuoteRequest)
    private readonly quoteRequests: Repository<QuoteRequest>,
  ) {}

  onModuleInit() {
    // ensure we catch up on any overdue requests immediately
    this.expirePendingRequests().catch((error) => {
      this.logger.error(
        'Initial quote request expiration failed',
        error instanceof Error ? error.stack : undefined,
      );
    });
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    try {
      await this.expirePendingRequests();
    } catch (error) {
      this.logger.error(
        'Failed to expire pending quote requests',
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  private async expirePendingRequests() {
    const now = new Date();
    const deadline = new Date(now.getTime() - QUOTE_REQUEST_LIFETIME_MS);

    await this.quoteRequests
      .createQueryBuilder()
      .update(QuoteRequest)
      .set({ status: 'expired' })
      .where('"status" = :pending', { pending: 'pending' })
      .andWhere('"createdAt" <= :deadline', { deadline })
      .execute();
  }
}
