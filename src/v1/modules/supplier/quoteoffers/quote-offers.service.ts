import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quote } from '../../../entities/quote-offers.entity';
import {
  QuoteRequest,
  QuoteRequestStatus,
} from '../../../entities/quotes/quote-request.entity';
import { Supplier } from '../../../entities/supplier.entity';
import { CreateQuoteOfferDto } from './dto/create-quote-offer.dto';
import {
  SupplierNotificationStatus,
  SupplierQuoteNotification,
} from '../../../entities/quotes/supplier-quote-notification.entity';

@Injectable()
export class SupplierQuoteOffersService {
  constructor(
    @InjectRepository(Quote) private readonly quotes: Repository<Quote>,
    @InjectRepository(QuoteRequest)
    private readonly quoteRequests: Repository<QuoteRequest>,
    @InjectRepository(Supplier)
    private readonly suppliers: Repository<Supplier>,
    @InjectRepository(SupplierQuoteNotification)
    private readonly supplierNotifications: Repository<SupplierQuoteNotification>,
  ) {}

  async listAvailableRequests(userId: string) {
    const supplier = await this.findSupplier(userId);
    return this.quotes.find({
      where: { supplier: { id: supplier.userId } as any },
      relations: ['quoteRequest'],
      order: { createdAt: 'DESC' },
    });
  }

  async createOffer(userId: string, dto: CreateQuoteOfferDto) {
    const supplier = await this.findSupplier(userId);
    const notification = await this.supplierNotifications.findOne({
      where: {
        supplier: { id: supplier.userId } as any,
        request: { id: dto.quoteRequestId } as any,
      },
      relations: ['request', 'request.user'],
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
    if (notification.expiresAt <= new Date()) {
      throw new BadRequestException(
        'This quote request notification has expired',
      );
    }
    const quoteRequest = notification.request;

    const requestDeadline = new Date(
      quoteRequest.createdAt.getTime() + 45 * 60 * 1000,
    );
    if (
      quoteRequest.status !== QuoteRequestStatus.PENDING ||
      new Date() > requestDeadline
    ) {
      throw new BadRequestException(
        'This quote request is no longer accepting offers',
      );
    }

    const existing = await this.quotes.findOne({
      where: {
        supplier: { id: supplier.userId } as any,
        quoteRequest: { id: dto.quoteRequestId } as any,
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

    const quote = this.quotes.create({
      quoteRequest,
      supplier: supplier.user,
      partName: dto.partName,
      brand: dto.brand,
      price: dto.price,
      estimatedTime: dto.estimatedTime,
      partCondition: dto.partCondition,
      notes: dto.notes,
      expiresAt,
    });
    const saved = await this.quotes.save(quote);
    notification.status = SupplierNotificationStatus.QUOTED;
    notification.quotedAt = new Date();
    await this.supplierNotifications.save(notification);
    if (quoteRequest.status === QuoteRequestStatus.PENDING) {
      quoteRequest.status = QuoteRequestStatus.QUOTED;
      await this.quoteRequests.save(quoteRequest);
    }
    return saved;
  }

  private async findSupplier(userId: string) {
    const supplier = await this.suppliers.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });
    if (!supplier) throw new NotFoundException('Supplier profile not found');
    return supplier;
  }

  private parseDate(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Invalid expiresAt value');
    }
    return date;
  }

  private defaultExpiry() {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    return expiresAt;
  }
}
