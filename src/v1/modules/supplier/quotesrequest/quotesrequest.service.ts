import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { QuoteRequest } from '../../../entities/quotes/quote-request.entity';
import { Supplier } from '../../../entities/supplier.entity';

type ListParams = {
  page?: number;
  limit?: number;
  search?: string;
};

@Injectable()
export class SupplierQuotesService {
  constructor(
    @InjectRepository(QuoteRequest)
    private readonly quotesRequest: Repository<QuoteRequest>,
    @InjectRepository(Supplier)
    private readonly suppliers: Repository<Supplier>,
  ) {}

  async listForSupplier(userId: string, params: ListParams) {
    const supplier = await this.suppliers.findOne({
      where: { user: { id: userId } as any },
      relations: ['user'],
    });
    if (!supplier) {
      throw new NotFoundException('Supplier profile not found');
    }

    const page = params.page && params.page > 0 ? params.page : 1;
    const limit =
      params.limit && params.limit > 0 ? Math.min(params.limit, 100) : 20;
    const skip = (page - 1) * limit;
    const search = params.search ? `%${params.search}%` : null;
    const qb = this.quotesRequest
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.user', 'user')
      .leftJoinAndSelect('request.quotes', 'allQuotes')
      .leftJoin(
        'request.quotes',
        'supplierQuote',
        'supplierQuote.supplierId = :supplierId',
        { supplierId: supplier.id },
      )
      .where('request.status = :pending', { pending: 'pending' })
      .andWhere(
        new Brackets((expr) => {
          expr
            .where('request."expiresAt" IS NULL')
            .orWhere('request."expiresAt" > :now', { now: new Date() });
        }),
      )
      .andWhere('supplierQuote.id IS NULL');

    if (search) {
      qb.andWhere(
        new Brackets((expr) => {
          expr
            .where('request.make ILIKE :search', { search })
            .orWhere('request.model ILIKE :search', { search });
        }),
      );
    }

    const [data, total] = await qb
      .orderBy('request.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { data, meta: { total, page, limit } };
  }

  async detail(id: string) {
    const request = await this.quotesRequest.findOne({
      where: { id },
      relations: ['user', 'quotes'],
    });
    if (!request) throw new NotFoundException('Quote request not found');
    return request;
  }
}
