import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { UserBadge, UserBadgeType } from '../../entities/user-badge.entity';
import { SupplierQuoteNotification } from '../../entities/quotes/supplier-quote-notification.entity';
import { Order, OrderStatus } from '../../entities/quotes/order.entity';
import { ReviewRating } from '../../entities/reviews_rating.entity';

type SupplierBadgeContext = {
  supplierId: string;
  avgResponseMinutes?: number;
  totalOrders?: number;
  totalReviews?: number;
  averageRating?: number;
};

type BuyerBadgeContext = {
  userId: string;
  totalOrders?: number;
  totalReviewsSubmitted?: number;
};

@Injectable()
export class BadgeAllocationService implements OnModuleInit {
  private readonly logger = new Logger(BadgeAllocationService.name);

  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(UserBadge)
    private readonly badges: Repository<UserBadge>,
    @InjectRepository(SupplierQuoteNotification)
    private readonly notifications: Repository<SupplierQuoteNotification>,
    @InjectRepository(Order)
    private readonly orders: Repository<Order>,
    @InjectRepository(ReviewRating)
    private readonly reviews: Repository<ReviewRating>,
  ) {}

  async onModuleInit() {
    await this.recalculateBadges().catch((error) => {
      this.logger.error(
        'Initial badge allocation failed',
        error instanceof Error ? error.stack : undefined,
      );
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async scheduleRecalculation() {
    try {
      await this.recalculateBadges();
    } catch (error) {
      this.logger.error(
        'Badge allocation cron failed',
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  async recalculateBadges() {
    await this.assignSupplierBadges();
    await this.assignBuyerBadges();
  }

  private async assignSupplierBadges() {
    const suppliers = await this.users.find({
      where: { role: 'supplier' },
      select: ['id'],
    });
    if (!suppliers.length) return;

    const contexts = new Map<string, SupplierBadgeContext>();
    const ensureContext = (supplierId: string) => {
      const existing = contexts.get(supplierId);
      if (existing) return existing;
      const ctx: SupplierBadgeContext = { supplierId };
      contexts.set(supplierId, ctx);
      return ctx;
    };

    const responseStats = await this.notifications
      .createQueryBuilder('notification')
      .select('"supplierId"', 'supplierId')
      .addSelect(
        'AVG(EXTRACT(EPOCH FROM ("quotedAt" - "createdAt")) / 60)',
        'avgMinutes',
      )
      .where('"quotedAt" IS NOT NULL')
      .groupBy('"supplierId"')
      .getRawMany<{ supplierId: string; avgMinutes: string | null }>();
    for (const stat of responseStats) {
      if (!stat.supplierId || !stat.avgMinutes) continue;
      ensureContext(stat.supplierId).avgResponseMinutes = Number(
        stat.avgMinutes,
      );
    }

    const orderStats = await this.orders
      .createQueryBuilder('order')
      .select('"supplierId"', 'supplierId')
      .addSelect('COUNT(order.id)', 'totalOrders')
      .where('order.status = :status', { status: OrderStatus.COMPLETED })
      .groupBy('"supplierId"')
      .getRawMany<{ supplierId: string; totalOrders: string }>();
    for (const stat of orderStats) {
      ensureContext(stat.supplierId).totalOrders = Number(stat.totalOrders);
    }

    const reviewStats = await this.reviews
      .createQueryBuilder('review')
      .select('"supplierId"', 'supplierId')
      .addSelect('COUNT(review.id)', 'totalReviews')
      .addSelect('COALESCE(AVG(review.rating), 0)', 'avgRating')
      .groupBy('"supplierId"')
      .getRawMany<{
        supplierId: string;
        totalReviews: string;
        avgRating: string;
      }>();
    for (const stat of reviewStats) {
      const ctx = ensureContext(stat.supplierId);
      ctx.totalReviews = Number(stat.totalReviews);
      ctx.averageRating = Number(stat.avgRating);
    }

    for (const supplier of suppliers) {
      const ctx = ensureContext(supplier.id);
      await this.syncBadge(
        supplier.id,
        UserBadgeType.FAST_RESPONDER,
        typeof ctx.avgResponseMinutes === 'number' &&
          ctx.avgResponseMinutes <= 30,
        ctx.avgResponseMinutes
          ? { averageResponseMinutes: ctx.avgResponseMinutes }
          : undefined,
      );
      await this.syncBadge(
        supplier.id,
        UserBadgeType.TOP_RATED,
        (ctx.averageRating ?? 0) >= 4.5 && (ctx.totalReviews ?? 0) >= 10,
        ctx.averageRating
          ? {
              averageRating: ctx.averageRating,
              totalReviews: ctx.totalReviews ?? 0,
            }
          : undefined,
      );
      await this.syncBadge(
        supplier.id,
        UserBadgeType.POWER_SELLER,
        (ctx.totalOrders ?? 0) >= 50,
        ctx.totalOrders ? { totalOrders: ctx.totalOrders } : undefined,
      );
      await this.syncBadge(
        supplier.id,
        UserBadgeType.CUSTOMER_FAVORITE,
        (ctx.averageRating ?? 0) >= 4.7 && (ctx.totalReviews ?? 0) >= 25,
        ctx.averageRating
          ? {
              averageRating: ctx.averageRating,
              totalReviews: ctx.totalReviews ?? 0,
            }
          : undefined,
      );
    }
  }

  private async assignBuyerBadges() {
    const buyers = await this.users.find({
      where: { role: 'user' },
      select: ['id'],
    });
    if (!buyers.length) return;

    const contexts = new Map<string, BuyerBadgeContext>();
    const ensureContext = (userId: string) => {
      const existing = contexts.get(userId);
      if (existing) return existing;
      const ctx: BuyerBadgeContext = { userId };
      contexts.set(userId, ctx);
      return ctx;
    };

    const orderStats = await this.orders
      .createQueryBuilder('order')
      .select('"buyerId"', 'userId')
      .addSelect('COUNT(order.id)', 'totalOrders')
      .where('order.status = :status', { status: OrderStatus.COMPLETED })
      .groupBy('"buyerId"')
      .getRawMany<{ userId: string; totalOrders: string }>();
    for (const stat of orderStats) {
      ensureContext(stat.userId).totalOrders = Number(stat.totalOrders);
    }

    const reviewStats = await this.reviews
      .createQueryBuilder('review')
      .select('"userId"', 'userId')
      .addSelect('COUNT(review.id)', 'totalReviewsSubmitted')
      .groupBy('"userId"')
      .getRawMany<{ userId: string; totalReviewsSubmitted: string }>();
    for (const stat of reviewStats) {
      ensureContext(stat.userId).totalReviewsSubmitted = Number(
        stat.totalReviewsSubmitted,
      );
    }

    for (const buyer of buyers) {
      const ctx = ensureContext(buyer.id);
      await this.syncBadge(
        buyer.id,
        UserBadgeType.LOYAL_BUYER,
        (ctx.totalOrders ?? 0) >= 10,
        ctx.totalOrders ? { totalOrders: ctx.totalOrders } : undefined,
      );
      await this.syncBadge(
        buyer.id,
        UserBadgeType.COMMUNITY_HELPER,
        (ctx.totalReviewsSubmitted ?? 0) >= 5,
        ctx.totalReviewsSubmitted
          ? { totalReviewsSubmitted: ctx.totalReviewsSubmitted }
          : undefined,
      );
    }
  }

  private async syncBadge(
    userId: string,
    badge: UserBadgeType,
    shouldHave: boolean,
    metadata?: Record<string, unknown>,
  ) {
    const existing = await this.badges.findOne({
      where: { user: { id: userId }, badge },
    });
    if (shouldHave) {
      if (existing) {
        existing.metadata = metadata ?? null;
        existing.expiresAt = null;
        await this.badges.save(existing);
        return;
      }
      const entity = this.badges.create({
        user: { id: userId } as User,
        badge,
        metadata: metadata ?? null,
      });
      await this.badges.save(entity);
      return;
    }
    if (existing) {
      await this.badges.remove(existing);
    }
  }
}
