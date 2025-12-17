import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Order } from '../../../entities/quotes/order.entity';
import { ReviewRating } from '../../../entities/reviews_rating.entity';
import { buildOrderResponse } from '../../../common/utils/order-response.util';

type ListOrdersParams = {
  page?: number;
  limit?: number;
  sortDir?: 'ASC' | 'DESC';
  search?: string;
};

@Injectable()
export class SupplierOrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orders: Repository<Order>,
    @InjectRepository(ReviewRating)
    private readonly reviews: Repository<ReviewRating>,
  ) {}

  async list(userId: string, params: ListOrdersParams) {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit =
      params.limit && params.limit > 0 ? Math.min(params.limit, 100) : 20;
    const skip = (page - 1) * limit;

    const qb = this.orders
      .createQueryBuilder('ord')
      .leftJoinAndSelect('ord.buyer', 'buyer')
      .leftJoinAndSelect('ord.request', 'request')
      .leftJoinAndSelect('ord.acceptedQuote', 'accepted_quote')
      .where('ord."supplierId" = :userId', { userId });

    if (params.search?.trim()) {
      const term = `%${params.search.trim()}%`;
      qb.andWhere(
        `(
          buyer."fullName" ILIKE :term
          OR request."registrationNumber" ILIKE :term
          OR accepted_quote."partName" ILIKE :term
          OR accepted_quote."brand" ILIKE :term
        )`,
        { term },
      );
    }

    const [records, total] = await qb
      .orderBy('ord.createdAt', params.sortDir || 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const reviewMap = await this.loadReviews(records);

    return {
      data: records.map((order) =>
        buildOrderResponse(order, reviewMap.get(order.id), {
          includeBuyer: true,
          includeQuote: true,
        }),
      ),
      meta: { total, page, limit },
    };
  }

  async detail(userId: string, orderId: string) {
    const order = await this.orders.findOne({
      where: { id: orderId },
      relations: ['buyer', 'supplier', 'request', 'acceptedQuote'],
    });
    if (!order || order.supplier.id !== userId) {
      throw new NotFoundException('Order not found');
    }
    const review = await this.reviews.findOne({
      where: { order: { id: order.id } },
    });
    return {
      data: buildOrderResponse(order, review, {
        includeBuyer: true,
        includeQuote: true,
      }),
    };
  }

  private async loadReviews(orders: Order[]) {
    const reviewMap = new Map<string, ReviewRating>();
    if (!orders.length) return reviewMap;
    const orderIds = orders.map((order) => order.id);
    const reviews = await this.reviews.find({
      where: { order: { id: In(orderIds) } },
    });
    for (const review of reviews) {
      if (review.orderId) {
        reviewMap.set(review.orderId, review);
      }
    }
    return reviewMap;
  }
}
