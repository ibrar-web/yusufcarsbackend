import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PromotionSnapshot,
  QuoteOffer,
} from '../../../entities/quote-offers.entity';
import {
  QuoteRequest,
  QuoteRequestStatus,
} from '../../../entities/quotes/quote-request.entity';
import { CreateQuoteOfferDto } from './dto/create-quote-offer.dto';
import {
  SupplierNotificationStatus,
  SupplierQuoteNotification,
} from '../../../entities/quotes/supplier-quote-notification.entity';
import { QuoteOfferSocketService } from '../../sockets/quote-offers/quote-offer-socket.service';
import {
  PromotionStatus,
  SupplierPromotion,
} from '../../../entities/supplier-promotion.entity';

@Injectable()
export class SupplierQuoteOffersService {
  constructor(
    @InjectRepository(QuoteOffer)
    private readonly quotesOffer: Repository<QuoteOffer>,
    @InjectRepository(QuoteRequest)
    private readonly quoteRequests: Repository<QuoteRequest>,
    @InjectRepository(SupplierQuoteNotification)
    private readonly supplierNotifications: Repository<SupplierQuoteNotification>,
    @InjectRepository(SupplierPromotion)
    private readonly promotions: Repository<SupplierPromotion>,
    private readonly quoteSockets: QuoteOfferSocketService,
  ) {}

  async listAvailableRequests(userId: string) {
    return this.quotesOffer.find({
      where: { supplier: { id: userId } },
      relations: ['quoteRequest'],
      order: { createdAt: 'DESC' },
    });
  }

  async createOffer(userId: string, dto: CreateQuoteOfferDto) {
    try {
      const notification = await this.supplierNotifications.findOne({
        where: {
          supplier: { id: userId },
          id: dto.quoteRequestId,
        },
        relations: ['request', 'request.user', 'supplier'],
      });

      if (!notification || !notification.request) {
        throw new NotFoundException(
          'You are not authorized to quote on this request',
        );
      }
      if (notification.status !== SupplierNotificationStatus.PENDING) {
        throw new BadRequestException(
          'This quote request notification is no longer active',
        );
      }
      const notificationExpiry = this.ensureDate(
        notification.expiresAt,
        'notification.expiresAt',
      );
      if (notificationExpiry <= new Date()) {
        throw new BadRequestException(
          'This quote request notification has expired',
        );
      }
      const quoteRequest = await this.quoteRequests.findOne({
        where: { id: notification.request.id },
        relations: [
          'user',
          'serviceItems',
          'serviceItems.subcategory',
          'serviceItems.subcategory.category',
        ],
      });
      if (!quoteRequest) {
        throw new NotFoundException('Quote request not found');
      }

      const requestCreatedAt = this.ensureDate(
        quoteRequest.createdAt,
        'quoteRequest.createdAt',
      );
      const requestDeadline = new Date(
        requestCreatedAt.getTime() + 45 * 60 * 1000,
      );
      if (
        quoteRequest.status !== QuoteRequestStatus.PENDING ||
        new Date() > requestDeadline
      ) {
        throw new BadRequestException(
          'This quote request is no longer accepting offers',
        );
      }

      const existing = await this.quotesOffer.findOne({
        where: {
          supplier: { id: userId },
          quoteRequest: { id: quoteRequest.id },
        },
      });
      if (existing) {
        throw new BadRequestException(
          'You have already submitted an offer for this request',
        );
      }

      const expiresAt = dto.expiresAt
        ? this.parseDate(dto.expiresAt)
        : this.defaultExpiry();

      const promotion = dto.promotionId
        ? await this.validatePromotion(dto.promotionId, userId, quoteRequest)
        : null;

      const promotionSnapshot = promotion
        ? this.buildPromotionSnapshot(promotion)
        : undefined;

      const quote = this.quotesOffer.create({
        quoteRequest,
        supplier: notification.supplier,
        partName: dto.partName,
        brand: dto.brand,
        price: dto.price,
        estimatedTime: dto.estimatedTime,
        partCondition: dto.partCondition,
        notes: dto.notes,
        expiresAt,
        promotion: promotion ?? undefined,
        promotionSnapshot: promotionSnapshot ?? null,
        offers: promotionSnapshot
          ? {
              promotion: promotionSnapshot,
            }
          : undefined,
      });
      const saved = await this.quotesOffer.save(quote);
      notification.status = SupplierNotificationStatus.QUOTED;
      notification.quotedAt = new Date();
      await this.supplierNotifications.save(notification);
      if (quoteRequest.user) {
        this.quoteSockets.emitOffer({
          type: 'received',
          id: saved.id,
          partName: saved.partName,
          brand: saved.brand,
          offers: saved.offers ?? null,
          promotion: saved.promotionSnapshot ?? null,
          price: saved.price,
          estimatedTime: saved.estimatedTime,
          partCondition: saved.partCondition ?? '',
          notes: saved.notes ?? null,
          expiresAt: saved.expiresAt,
          status: saved.status,
          createdAt: saved.createdAt ?? new Date(),
          updatedAt: saved.updatedAt ?? new Date(),
          quoteRequestId: quoteRequest.id,
          supplier: {
            id: notification.supplier.id,
            email: notification.supplier.email,
            firstName:
              notification.supplier.firstName ||
              notification.supplier.email ||
              'Supplier',
          },
          userId: quoteRequest.user.id,
        });
      }
      return saved;
    } catch (error: unknown) {
      console.error('Failed to create supplier quote offer', {
        userId,
        quoteRequestId: dto?.quoteRequestId,
        error,
      });
      throw error;
    }
  }

  private parseDate(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Invalid expiresAt value');
    }
    return date;
  }

  private ensureDate(value: Date | string, field: string) {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`Invalid ${field} value`);
    }
    return date;
  }

  private defaultExpiry() {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    return expiresAt;
  }

  private async validatePromotion(
    promotionId: string,
    supplierId: string,
    quoteRequest: QuoteRequest,
  ) {
    const promotion = await this.promotions.findOne({
      where: { id: promotionId, supplier: { id: supplierId } },
      relations: [
        'targetCategory',
        'targetItem',
        'targetItem.subcategory',
        'targetItem.subcategory.category',
      ],
    });
    if (!promotion) {
      throw new NotFoundException('Promotion not found');
    }
    const now = new Date();
    if (
      promotion.status !== PromotionStatus.ACTIVE ||
      promotion.endsAt <= now ||
      promotion.startsAt > now
    ) {
      throw new BadRequestException('Promotion is not active');
    }
    if (!this.promotionMatchesRequest(promotion, quoteRequest)) {
      throw new BadRequestException(
        'Promotion is not applicable to this quote request',
      );
    }
    return promotion;
  }

  private promotionMatchesRequest(
    promotion: SupplierPromotion,
    quoteRequest: QuoteRequest,
  ) {
    const items = quoteRequest.serviceItems ?? [];
    if (!promotion.targetItem && !promotion.targetCategory) {
      return true;
    }
    if (promotion.targetItem) {
      if (items.length) {
        return items.some((item) => item.id === promotion.targetItem?.id);
      }
      const services = quoteRequest.services ?? [];
      return services.some((service) => service === promotion.targetItem?.id);
    }
    if (promotion.targetCategory) {
      const itemMatch = items.some((item) => {
        const categoryId = item.subcategory?.category?.id;
        return categoryId && categoryId === promotion.targetCategory?.id;
      });
      if (itemMatch) return true;
      const services = quoteRequest.services ?? [];
      return services.some((service) => {
        return (
          service === promotion.targetCategory?.id ||
          service === promotion.targetCategory?.slug
        );
      });
    }
    return false;
  }

  private buildPromotionSnapshot(
    promotion: SupplierPromotion,
  ): PromotionSnapshot {
    return {
      id: promotion.id,
      title: promotion.title,
      discountType: promotion.discountType,
      discountValue: promotion.discountValue,
      startsAt: promotion.startsAt.toISOString(),
      endsAt: promotion.endsAt.toISOString(),
      targetCategoryId: promotion.targetCategory?.id ?? null,
      targetItemId: promotion.targetItem?.id ?? null,
    };
  }
}
