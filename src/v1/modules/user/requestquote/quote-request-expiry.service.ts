import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { In, MoreThan, Repository } from 'typeorm';
import {
  QuoteRequest,
  QuoteRequestStatus,
} from '../../../entities/quotes/quote-request.entity';
import {
  SupplierNotificationStatus,
  SupplierQuoteNotification,
} from '../../../entities/quotes/supplier-quote-notification.entity';
import { QuoteExpiryQueueService } from '../../../common/aws/quote-expiry-queue.service';
import { QuoteRequestSocketService } from '../../sockets/quote-requests/quote-request-socket.service';

@Injectable()
export class QuoteRequestExpiryService implements OnModuleInit {
  private readonly logger = new Logger(QuoteRequestExpiryService.name);

  constructor(
    @InjectRepository(QuoteRequest)
    private readonly quoteRequests: Repository<QuoteRequest>,
    @InjectRepository(SupplierQuoteNotification)
    private readonly notifications: Repository<SupplierQuoteNotification>,
    private readonly queue: QuoteExpiryQueueService,
    private readonly sockets: QuoteRequestSocketService,
  ) {}

  async onModuleInit() {
    await this.enqueueOutstanding().catch((error) => {
      this.logger.error(
        'Unable to enqueue outstanding quote expirations',
        error instanceof Error ? error.stack : undefined,
      );
    });
    await this.processQueue().catch((error) => {
      this.logger.error(
        'Initial quote expiry processing failed',
        error instanceof Error ? error.stack : undefined,
      );
    });
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    try {
      await this.processQueue();
    } catch (error) {
      this.logger.error(
        'Failed to process quote expiry queue',
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  private async enqueueOutstanding() {
    const now = new Date();
    const pendingRequests = await this.quoteRequests.find({
      where: {
        status: In([
          QuoteRequestStatus.PENDING,
          QuoteRequestStatus.QUOTED,
        ]),
        expiresAt: MoreThan(now),
      },
      select: ['id', 'expiresAt'],
    });
    for (const request of pendingRequests) {
      if (request.expiresAt) {
        await this.queue.scheduleQuoteRequestExpiry(
          request.id,
          request.expiresAt,
        );
      }
    }

    const pendingNotifications = await this.notifications.find({
      where: {
        status: SupplierNotificationStatus.PENDING,
        expiresAt: MoreThan(now),
      },
      select: ['id', 'expiresAt'],
    });
    for (const notification of pendingNotifications) {
      await this.queue.scheduleNotificationExpiry(
        notification.id,
        notification.expiresAt,
      );
    }
  }

  private async processQueue() {
    const batch = await this.queue.receiveBatch();
    if (!batch.length) return;
    for (const message of batch) {
      const executeAt = new Date(message.payload.executeAt);
      if (Number.isNaN(executeAt.getTime())) {
        await this.queue.delete(message.raw);
        continue;
      }
      if (executeAt.getTime() > Date.now()) {
        await this.queue.delayUntil(message.raw, executeAt);
        continue;
      }
      try {
        if (message.payload.type === 'quote-request') {
          await this.expireQuoteRequest(message.payload.requestId);
        } else {
          await this.expireSupplierNotification(
            message.payload.notificationId,
          );
        }
        await this.queue.delete(message.raw);
      } catch (error) {
        this.logger.error(
          'Failed to process quote expiry message',
          error instanceof Error ? error.stack : undefined,
        );
        await this.queue.delayUntil(
          message.raw,
          new Date(Date.now() + 60 * 1000),
        );
      }
    }
  }

  private async expireQuoteRequest(requestId: string) {
    const request = await this.quoteRequests.findOne({
      where: { id: requestId },
    });
    if (!request) return;
    if (
      request.status !== QuoteRequestStatus.PENDING &&
      request.status !== QuoteRequestStatus.QUOTED
    ) {
      return;
    }
    request.status = QuoteRequestStatus.EXPIRED;
    await this.quoteRequests.save(request);
    await this.notifications
      .createQueryBuilder()
      .update(SupplierQuoteNotification)
      .set({ status: SupplierNotificationStatus.EXPIRED })
      .where('"requestId" = :requestId', { requestId })
      .andWhere('"status" = :pending', {
        pending: SupplierNotificationStatus.PENDING,
      })
      .execute();
    this.sockets.emitUpdated({
      requestId: request.id,
      status: request.status,
      postCode: request.postcode,
      serviceCategories: request.services || [],
      updatedAt: new Date(),
    });
  }

  private async expireSupplierNotification(notificationId: string) {
    const notification = await this.notifications.findOne({
      where: { id: notificationId },
    });
    if (!notification) return;
    if (notification.status !== SupplierNotificationStatus.PENDING) return;
    notification.status = SupplierNotificationStatus.EXPIRED;
    await this.notifications.save(notification);
  }
}
