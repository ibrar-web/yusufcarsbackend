import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  Order,
  OrderStatus,
} from '../../../entities/quotes/order.entity';
import { ReviewRating } from '../../../entities/reviews_rating.entity';
import { buildOrderResponse } from '../../../common/utils/order-response.util';
import { CompleteOrderDto } from './dto/complete-order.dto';

type ListOrdersParams = {
  page?: number;
  limit?: number;
  sortDir?: 'ASC' | 'DESC';
};

@Injectable()
export class UserOrdersService {
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

    const [records, total] = await this.orders.findAndCount({
      where: { buyer: { id: userId } as any },
      relations: ['supplier', 'request', 'acceptedQuote'],
      order: { createdAt: params.sortDir || 'DESC' },
      skip,
      take: limit,
    });

    const reviewMap = await this.loadReviews(records);

    return {
      data: records.map((order) =>
        buildOrderResponse(order, reviewMap.get(order.id), {
          includeSupplier: true,
          includeQuote: true,
        }),
      ),
      meta: { total, page, limit },
    };
  }

  async detail(userId: string, orderId: string) {
    const order = await this.orders.findOne({
      where: { id: orderId },
      relations: ['supplier', 'buyer', 'request', 'acceptedQuote'],
    });
    if (!order || order.buyer.id !== userId) {
      throw new NotFoundException('Order not found');
    }
    const review = await this.reviews.findOne({
      where: { order: { id: order.id }, user: { id: userId } } as any,
    });
    return buildOrderResponse(order, review, {
      includeSupplier: true,
      includeQuote: true,
    });
  }

  async complete(userId: string, orderId: string, dto: CompleteOrderDto) {
    const order = await this.orders.findOne({
      where: { id: orderId },
      relations: ['supplier', 'buyer', 'request', 'acceptedQuote'],
    });
    if (!order || order.buyer.id !== userId) {
      throw new NotFoundException('Order not found');
    }
    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Cannot complete a cancelled order');
    }
    if (order.status === OrderStatus.COMPLETED) {
      throw new BadRequestException('Order already completed');
    }

    order.status = OrderStatus.COMPLETED;
    await this.orders.save(order);

    let review = await this.reviews.findOne({
      where: { order: { id: order.id }, user: { id: userId } } as any,
    });
    if (review) {
      review.rating = dto.rating;
      review.comment = dto.comment;
    } else {
      review = this.reviews.create({
        user: order.buyer,
        supplier: order.supplier,
        order,
        rating: dto.rating,
        comment: dto.comment,
      });
    }
    review = await this.reviews.save(review);

    return buildOrderResponse(order, review, {
      includeSupplier: true,
      includeQuote: true,
    });
  }

  private async loadReviews(orders: Order[]) {
    const reviewMap = new Map<string, ReviewRating>();
    if (!orders.length) return reviewMap;
    const reviewIds = orders.map((order) => order.id);
    const reviews = await this.reviews.find({
      where: { order: { id: In(reviewIds) } } as any,
    });
    for (const review of reviews) {
      if (review.orderId) {
        reviewMap.set(review.orderId, review);
      }
    }
    return reviewMap;
  }
}
