import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Order, OrderStatus } from '../../../entities/quotes/order.entity';
import { ReviewRating } from '../../../entities/reviews_rating.entity';
import { buildOrderResponse } from '../../../common/utils/order-response.util';
import { CompleteOrderDto } from './dto/complete-order.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';

type ListOrdersParams = {
  page?: number;
  limit?: number;
  sortDir?: 'ASC' | 'DESC';
  search?: string;
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

    const qb = this.orders
      .createQueryBuilder('ord')
      .leftJoinAndSelect('ord.supplier', 'supplier')
      .leftJoinAndSelect('ord.acceptedQuote', 'acceptedQuote')
      .leftJoinAndSelect('ord.request', 'request')
      .where('ord."buyerId" = :userId', { userId });

    if (params.search?.trim()) {
      const term = `%${params.search.trim()}%`;
      qb.andWhere(
        `(
          request."registrationNumber" ILIKE :term
          OR supplier."fullName" ILIKE :term
          OR acceptedQuote."partName" ILIKE :term
          OR acceptedQuote."brand" ILIKE :term
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
    return {
      data: buildOrderResponse(order, review, {
        includeSupplier: true,
        includeQuote: true,
      }),
    };
  }

  async complete(userId: string, orderId: string, dto: CompleteOrderDto) {
    try {
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
      if (order.status !== OrderStatus.COMPLETED) {
        order.status = OrderStatus.COMPLETED;
        await this.orders.save(order);
      }

      let review = await this.reviews.findOne({
        where: { order: { id: order.id }, user: { id: userId } } as any,
      });
      if (review) {
        if (dto.rating !== undefined) {
          review.rating = dto.rating;
        }
        if (dto.comment !== undefined) {
          review.comment = dto.comment;
        }
      } else {
        if (dto.rating === undefined) {
          throw new BadRequestException(
            'Rating is required when submitting a review for the first time',
          );
        }
        review = this.reviews.create({
          user: order.buyer,
          supplier: order.supplier,
          order,
          rating: dto.rating,
          comment: dto.comment,
        });
      }
      review = await this.reviews.save(review);
      order.reviewSubmitted = true;
      await this.orders.save(order);

      return buildOrderResponse(order, review, {
        includeSupplier: true,
        includeQuote: true,
      });
    } catch (error) {
      console.log('error', error);
    }
  }

  async cancel(userId: string, orderId: string, dto: CancelOrderDto) {
    const order = await this.orders.findOne({
      where: { id: orderId },
      relations: ['buyer', 'supplier', 'request', 'acceptedQuote'],
    });
    if (!order || order.buyer.id !== userId) {
      throw new NotFoundException('Order not found');
    }
    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Order already cancelled');
    }
    if (order.status === OrderStatus.COMPLETED) {
      throw new BadRequestException('Completed orders cannot be cancelled');
    }
    order.status = OrderStatus.CANCELLED;
    order.cancellationReason = dto.reason ?? 'Cancelled by user';
    await this.orders.save(order);

    return buildOrderResponse(order, null, {
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
