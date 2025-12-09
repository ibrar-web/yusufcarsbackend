import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, FindOptionsWhere } from 'typeorm';
import {
  Order,
  OrderStatus,
} from '../../../entities/quotes/order.entity';
import { ReviewRating } from '../../../entities/reviews_rating.entity';
import {
  buildOrderResponse,
  OrderResponse,
} from '../../../common/utils/order-response.util';

type ListOrdersParams = {
  page?: number;
  limit?: number;
  sortDir?: 'ASC' | 'DESC';
  status?: string;
};

@Injectable()
export class AdminOrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orders: Repository<Order>,
    @InjectRepository(ReviewRating)
    private readonly reviews: Repository<ReviewRating>,
  ) {}

  async list(params: ListOrdersParams) {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit =
      params.limit && params.limit > 0 ? Math.min(params.limit, 100) : 50;
    const skip = (page - 1) * limit;

    const statusFilter = this.normalizeStatus(params.status);
    const where: FindOptionsWhere<Order> | undefined = statusFilter
      ? { status: statusFilter }
      : undefined;

    const [records, total] = await this.orders.findAndCount({
      where,
      relations: ['buyer', 'supplier', 'request', 'acceptedQuote'],
      order: { createdAt: params.sortDir || 'DESC' },
      skip,
      take: limit,
    });

    const reviewMap = await this.loadReviews(records);

    return {
      data: records.map((order) =>
        buildOrderResponse(order, reviewMap.get(order.id), {
          includeBuyer: true,
          includeSupplier: true,
          includeQuote: true,
        }),
      ),
      meta: { total, page, limit },
    };
  }

  async detail(orderId: string): Promise<OrderResponse> {
    const order = await this.orders.findOne({
      where: { id: orderId },
      relations: ['buyer', 'supplier', 'request', 'acceptedQuote'],
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    const review = await this.reviews.findOne({
      where: { order: { id: order.id } } as any,
    });
    return buildOrderResponse(order, review, {
      includeBuyer: true,
      includeSupplier: true,
      includeQuote: true,
    });
  }

  private async loadReviews(orders: Order[]) {
    const reviewMap = new Map<string, ReviewRating>();
    if (!orders.length) return reviewMap;
    const orderIds = orders.map((order) => order.id);
    const reviews = await this.reviews.find({
      where: { order: { id: In(orderIds) } } as any,
    });
    for (const review of reviews) {
      if (review.orderId) {
        reviewMap.set(review.orderId, review);
      }
    }
    return reviewMap;
  }

  private normalizeStatus(status?: string) {
    if (!status) return undefined;
    const normalized = status.toLowerCase() as OrderStatus;
    if ((Object.values(OrderStatus) as string[]).includes(normalized)) {
      return normalized as OrderStatus;
    }
    return undefined;
  }
}
