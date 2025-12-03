import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import {
  QuoteRequest,
  QuoteRequestStatus,
} from '../../../entities/quotes/quote-request.entity';
import {
  SupplierNotificationStatus,
  SupplierQuoteNotification,
} from '../../../entities/quotes/supplier-quote-notification.entity';
import { QuoteRequestSocketService } from '../../sockets/quote-requests/quote-request-socket.service';

@Injectable()
export class QuoteRequestExpiryService implements OnModuleInit {
  private readonly logger = new Logger(QuoteRequestExpiryService.name);

  constructor(
    @InjectRepository(QuoteRequest)
    private readonly quoteRequests: Repository<QuoteRequest>,
    @InjectRepository(SupplierQuoteNotification)
    private readonly notifications: Repository<SupplierQuoteNotification>,
    private readonly sockets: QuoteRequestSocketService,
  ) {}

  async onModuleInit() {
    await this.processExpirations().catch((error) => {
      this.logger.error(
        'Initial quote expiry processing failed',
        error instanceof Error ? error.stack : undefined,
      );
    });
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    try {
      await this.processExpirations();
    } catch (error) {
      this.logger.error(
        'Failed to process quote expirations',
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  private async processExpirations() {
    const now = new Date();
    await this.expireDueQuoteRequests(now);
    await this.expireDueNotifications(now);
  }

  private async expireDueQuoteRequests(cutoff: Date) {
    const pending = await this.quoteRequests.find({
      where: {
        status: QuoteRequestStatus.PENDING,
        expiresAt: LessThanOrEqual(cutoff),
      },
    });
    for (const request of pending) {
      request.status = QuoteRequestStatus.EXPIRED;
      await this.quoteRequests.save(request);
      await this.notifications
        .createQueryBuilder()
        .update(SupplierQuoteNotification)
        .set({ status: SupplierNotificationStatus.EXPIRED })
        .where('"requestId" = :requestId', { requestId: request.id })
        .andWhere('"status" = :pending', {
          pending: SupplierNotificationStatus.PENDING,
        })
        .execute();
      const supplierIds = await this.findSupplierIdsForRequest(request.id);
      if (supplierIds.length) {
        this.sockets.emit(
          {
            type: 'updated',
            requestId: request.id,
            status: request.status,
            postCode: request.postcode,
            serviceCategories: request.services || [],
            updatedAt: new Date(),
          },
          supplierIds,
        );
      }
    }
  }

  private async expireDueNotifications(cutoff: Date) {
    await this.notifications
      .createQueryBuilder()
      .update(SupplierQuoteNotification)
      .set({ status: SupplierNotificationStatus.EXPIRED })
      .where('"status" = :pending', {
        pending: SupplierNotificationStatus.PENDING,
      })
      .andWhere('"expiresAt" <= :cutoff', { cutoff })
      .execute();
  }

  private async findSupplierIdsForRequest(requestId: string) {
    const notifications = await this.notifications.find({
      where: { request: { id: requestId } },
      select: ['supplierId'],
    });
    return notifications
      .map((notification) => notification.supplierId)
      .filter((id): id is string => Boolean(id));
  }
}
