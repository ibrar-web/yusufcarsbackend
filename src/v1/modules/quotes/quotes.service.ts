import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuoteRequest } from './quote-request.entity';
import { Quote } from './quote.entity';
import { User } from '../users/user.entity';
import { Supplier } from '../suppliers/supplier.entity';

@Injectable()
export class QuotesService {
  constructor(
    @InjectRepository(QuoteRequest) private readonly quoteRequests: Repository<QuoteRequest>,
    @InjectRepository(Quote) private readonly quotes: Repository<Quote>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Supplier) private readonly suppliers: Repository<Supplier>,
  ) {}

  async createRequest(userId: string, dto: Partial<QuoteRequest>) {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    const req = this.quoteRequests.create({
      user,
      maker: dto.maker!,
      model: dto.model!,
      year: dto.year,
      fuelType: dto.fuelType,
      engineSize: dto.engineSize,
      services: dto.services,
      postcode: dto.postcode,
      requireFitment: !!dto.requireFitment,
      requestType: (dto.requestType as any) || 'local',
      status: 'pending',
    });
    // 45 min expiry placeholder
    req.expiresAt = new Date(Date.now() + 45 * 60 * 1000);
    return await this.quoteRequests.save(req);
  }

  async respond(supplierUserId: string, dto: { quoteRequestId: string; price: number; deliveryTime: string }) {
    const supplier = await this.suppliers.findOne({ where: { user: { id: supplierUserId } as any } });
    if (!supplier) throw new BadRequestException('Not a supplier');
    const req = await this.quoteRequests.findOne({ where: { id: dto.quoteRequestId } });
    if (!req) throw new NotFoundException('Request not found');
    if (req.status !== 'pending' || (req.expiresAt && req.expiresAt.getTime() < Date.now())) {
      throw new BadRequestException('Request expired');
    }
    const quote = this.quotes.create({
      quoteRequest: req,
      supplier,
      price: dto.price,
      deliveryTime: dto.deliveryTime,
      expiresAt: new Date(Date.now() + 45 * 60 * 1000),
      status: 'pending',
    });
    return await this.quotes.save(quote);
  }

  async accept(customerId: string, id: string) {
    const quote = await this.quotes.findOne({ where: { id } });
    if (!quote) throw new NotFoundException('Quote not found');
    if (quote.quoteRequest.user.id !== customerId) throw new BadRequestException('Not your request');
    quote.status = 'accepted';
    await this.quotes.save(quote);
    // Expire others would require query builder; omitted for brevity.
    return quote;
  }

  async myRequests(userId: string) {
    return this.quoteRequests.find({ where: { user: { id: userId } as any }, order: { createdAt: 'DESC' } });
  }
}


