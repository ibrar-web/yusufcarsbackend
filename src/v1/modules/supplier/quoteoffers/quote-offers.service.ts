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

@Injectable()
export class SupplierQuoteOffersService {
  constructor(
    @InjectRepository(Quote) private readonly quotes: Repository<Quote>,
    @InjectRepository(QuoteRequest)
    private readonly quoteRequests: Repository<QuoteRequest>,
    @InjectRepository(Supplier)
    private readonly suppliers: Repository<Supplier>,
  ) {}

  async listAvailableRequests(userId: string) {
    const supplier = await this.findSupplier(userId);
    const [pendingRequests, submitted] = await Promise.all([
      this.quoteRequests.find({
        where: { status: 'pending' },
        order: { createdAt: 'DESC' },
      }),
      this.quotes.find({
        where: { supplier: { id: supplier.id } as any },
        relations: ['quoteRequest'],
      }),
    ]);

    const submittedIds = new Set(submitted.map((quote) => quote.quoteRequest.id));
    return pendingRequests.filter((request) => !submittedIds.has(request.id));
  }

  async createOffer(userId: string, dto: CreateQuoteOfferDto) {
    const supplier = await this.findSupplier(userId);
    const quoteRequest = await this.quoteRequests.findOne({
      where: { id: dto.quoteRequestId },
    });
    if (!quoteRequest) throw new NotFoundException('Quote request not found');

    const existing = await this.quotes.findOne({
      where: {
        supplier: { id: supplier.id } as any,
        quoteRequest: { id: quoteRequest.id } as any,
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
      deliveryTime: dto.deliveryTime,
      expiresAt,
    });
    return this.quotes.save(quote);
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
