import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuoteRequest } from '../../../entities/quote-request.entity';

type ListNotificationsParams = {
  page?: number;
  limit?: number;
  status?: QuoteRequest['status'];
};

@Injectable()
export class UserNotificationsService {
  constructor(@InjectRepository(QuoteRequest) private readonly requests: Repository<QuoteRequest>) {}

  async availableQuotes(userId: string, params: ListNotificationsParams) {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit = params.limit && params.limit > 0 ? Math.min(params.limit, 100) : 20;
    const skip = (page - 1) * limit;

    const [data, total] = await this.requests.findAndCount({
      where: {
        user: { id: userId } as any,
        ...(params.status ? { status: params.status } : {}),
      },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { data, meta: { total, page, limit } };
  }
}
