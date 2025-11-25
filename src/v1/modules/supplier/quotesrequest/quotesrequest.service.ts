import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { QuoteRequest } from '../../../entities/quote-request.entity';

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
  ) {}

  async listForSupplier(params: ListParams) {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit =
      params.limit && params.limit > 0 ? Math.min(params.limit, 100) : 20;
    const skip = (page - 1) * limit;
    const where: FindOptionsWhere<QuoteRequest> = {
      ...{ status: 'pending' },
      ...(params.search
        ? {
            make: ILike(`%${params.search}%`),
            model: ILike(`%${params.search}%`),
          }
        : {}),
    };
    const [data, total] = await this.quotesRequest.findAndCount({
      where,
      relations: ['user', 'quotes'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

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
