import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PromotionStatus,
  SupplierPromotion,
} from '../../../entities/supplier-promotion.entity';

@Injectable()
export class PromotionLifecycleService implements OnModuleInit {
  private readonly logger = new Logger(PromotionLifecycleService.name);

  constructor(
    @InjectRepository(SupplierPromotion)
    private readonly promotions: Repository<SupplierPromotion>,
  ) {}

  async onModuleInit() {
    await this.refreshStatuses().catch((error) => {
      this.logger.error(
        'Failed to refresh promotion statuses on boot',
        error instanceof Error ? error.stack : undefined,
      );
    });
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    try {
      await this.refreshStatuses();
    } catch (error) {
      this.logger.error(
        'Failed to refresh promotion statuses',
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  private async refreshStatuses() {
    const now = new Date();
    await this.promotions
      .createQueryBuilder()
      .update(SupplierPromotion)
      .set({ status: PromotionStatus.EXPIRED })
      .where('"status" != :expired', { expired: PromotionStatus.EXPIRED })
      .andWhere('"endsAt" <= :now', { now })
      .execute();

    await this.promotions
      .createQueryBuilder()
      .update(SupplierPromotion)
      .set({ status: PromotionStatus.ACTIVE })
      .where('"status" IN (:...pending)', {
        pending: [PromotionStatus.DRAFT, PromotionStatus.SCHEDULED],
      })
      .andWhere(':now BETWEEN "startsAt" AND "endsAt"', { now })
      .execute();
  }
}
