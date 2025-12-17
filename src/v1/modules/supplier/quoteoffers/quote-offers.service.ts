import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuoteOffer } from '../../../entities/quote-offers.entity';
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

@Injectable()
export class SupplierQuoteOffersService {
  constructor(
    @InjectRepository(QuoteOffer)
    private readonly quotesOffer: Repository<QuoteOffer>,
    @InjectRepository(QuoteRequest)
    private readonly quoteRequests: Repository<QuoteRequest>,
    @InjectRepository(SupplierQuoteNotification)
    private readonly supplierNotifications: Repository<SupplierQuoteNotification>,
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
      const quoteRequest = notification.request;

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
          quoteRequest: { id: dto.quoteRequestId },
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
            fullName:
              notification.supplier.fullName ||
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
}
