import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quote } from '../../../entities/quote.entity';

type ListOrdersParams = {
  page?: number;
  limit?: number;
  sortDir?: 'ASC' | 'DESC';
};

@Injectable()
export class UserOrdersService {
  constructor(
    @InjectRepository(Quote) private readonly quotes: Repository<Quote>,
  ) {}

  async list(userId: string, params: ListOrdersParams) {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit =
      params.limit && params.limit > 0 ? Math.min(params.limit, 100) : 20;
    const skip = (page - 1) * limit;

    const [data, total] = await this.quotes.findAndCount({
      where: { quoteRequest: { user: { id: userId } as any } as any },
      relations: ['quoteRequest', 'supplier'],
      order: { createdAt: params.sortDir || 'DESC' },
      skip,
      take: limit,
    });

    return { data, meta: { total, page, limit } };
  }
}
