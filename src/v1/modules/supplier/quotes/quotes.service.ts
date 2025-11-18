import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { Quote } from '../../quotes/quote.entity';
import { QuoteStatus } from './quotes.types';

type ListParams = {
  page?: number;
  limit?: number;
  status?: QuoteStatus;
  sortDir?: 'ASC' | 'DESC';
  search?: string;
};

@Injectable()
export class SupplierQuotesService {
  constructor(@InjectRepository(Quote) private readonly quotes: Repository<Quote>) {}

  async listForSupplier(params: ListParams) {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit = params.limit && params.limit > 0 ? Math.min(params.limit, 100) : 20;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<Quote> = {
      ...(params.status ? { status: params.status } : {}),
      ...(params.search
        ? {
            // Search on quoteRequest.maker/model
            quoteRequest: {
              maker: ILike(`%${params.search}%`),
              model: ILike(`%${params.search}%`),
            } as any,
          }
        : {}),
    };

    const [data, total] = await this.quotes.findAndCount({
      where,
      relations: ['quoteRequest', 'supplier'],
      order: { createdAt: params.sortDir || 'DESC' },
      skip,
      take: limit,
    });

    return { data, meta: { total, page, limit } };
  }

  async detail(id: string) {
    const quote = await this.quotes.findOne({
      where: { id },
      relations: ['quoteRequest', 'supplier'],
    });
    if (!quote) throw new NotFoundException('Quote not found');
    return quote;
  }
}
