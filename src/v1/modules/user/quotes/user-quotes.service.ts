import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Quote } from 'src/v1/entities/quote-offers.entity';
import { Repository } from 'typeorm';

type ListQupotesParams = {
  page?: number;
  limit?: number;
  status?: Quote['status'];
};

@Injectable()
export class UserQuotesService {
  constructor(
    @InjectRepository(Quote)
    private readonly offers: Repository<Quote>,
  ) {}

  async availableQuotes(userId: string, params: ListQupotesParams) {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit =
      params.limit && params.limit > 0 ? Math.min(params.limit, 100) : 20;
    const skip = (page - 1) * limit;

    const [data, total] = await this.offers.findAndCount({
      where: {
        quoteRequest: { user: { id: userId } as any } as any,
        ...(params.status ? { status: params.status } : {}),
      },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { data, meta: { total, page, limit } };
  }
}
