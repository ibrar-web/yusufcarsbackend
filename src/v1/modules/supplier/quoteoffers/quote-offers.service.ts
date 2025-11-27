import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quote } from '../../../entities/quote-offers.entity';
import { QuoteRequest } from '../../../entities/quote-request.entity';
import { Supplier } from '../../../entities/supplier.entity';
import { CreateQuoteOfferDto } from './dto/create-quote-offer.dto';
import { QuoteOfferSocketService } from '../../sockets/quote-offers/quote-offer-socket.service';

@Injectable()
export class SupplierQuoteOffersService {
  constructor(
    @InjectRepository(Quote) private readonly quotes: Repository<Quote>,
    @InjectRepository(QuoteRequest)
    private readonly quoteRequests: Repository<QuoteRequest>,
    @InjectRepository(Supplier)
    private readonly suppliers: Repository<Supplier>,
    private readonly quoteOfferSocket: QuoteOfferSocketService,
  ) {}

  async listAvailableRequests(userId: string) {
    const supplier = await this.findSupplier(userId);
    return this.quotes.find({
      where: { supplier: { id: supplier.id } as any },
      relations: ['quoteRequest'],
      order: { createdAt: 'DESC' },
    });
  }

  async createOffer(userId: string, dto: CreateQuoteOfferDto) {
    const supplier = await this.findSupplier(userId);
    const quoteRequest = await this.quoteRequests.findOne({
      where: { id: dto.quoteRequestId },
      relations: ['user'],
    });
    if (!quoteRequest) throw new NotFoundException('Quote request not found');

    const requestDeadline = new Date(
      quoteRequest.createdAt.getTime() + 45 * 60 * 1000,
    );
    if (quoteRequest.status !== 'pending' || new Date() > requestDeadline) {
      throw new BadRequestException(
        'This quote request is no longer accepting offers',
      );
    }

    const existing = await this.quotes.findOne({
      where: {
        supplier: { id: supplier.id } as any,
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
      supplier,
      price: dto.price,
      estimatedTime: dto.estimatedTime,
      partCondition: dto.partCondition,
      notes: dto.notes,
      expiresAt,
    });
    const saved = await this.quotes.save(quote);

    this.quoteOfferSocket.emitOfferReceived({
      offerId: saved.id,
      quoteRequestId: quoteRequest.id,
      userId: quoteRequest.user.id,
      price: saved.price,
      supplierName: supplier.businessName,
      notes: saved.notes,
      createdAt: saved.createdAt.toISOString(),
    });

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
