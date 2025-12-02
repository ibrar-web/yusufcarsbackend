import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quote, QuoteStatus } from '../../../entities/quote-offers.entity';
import {
  QuoteRequest,
  QuoteRequestStatus,
} from '../../../entities/quotes/quote-request.entity';
import { Order, OrderStatus } from '../../../entities/quotes/order.entity';
import {
  SupplierNotificationStatus,
  SupplierQuoteNotification,
} from '../../../entities/quotes/supplier-quote-notification.entity';
import { QuoteRequestSocketService } from '../../sockets/quote-requests/quote-request-socket.service';

type ListQupotesParams = {
  page?: number;
  limit?: number;
  status?: Quote['status'];
};

type LimitedSupplier = {
  id: string;
  userId: string | null;
  businessName: string | null;
  tradingAs: string | null;
};

@Injectable()
export class UserQuotesService {
  constructor(
    @InjectRepository(Quote)
    private readonly offers: Repository<Quote>,
    @InjectRepository(Order)
    private readonly orders: Repository<Order>,
    private readonly sockets: QuoteRequestSocketService,
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

    const sanitizedData = data.map((quote) => {
      const { supplier, quoteRequest, ...rest } = quote;
      const sanitizedQuoteRequest = quoteRequest
        ? { ...quoteRequest }
        : null;
      if (sanitizedQuoteRequest) {
        delete (sanitizedQuoteRequest as any).user;
      }
      return {
        ...rest,
        quoteRequest: sanitizedQuoteRequest,
        supplier: supplier
          ? ({
              id: supplier.id,
              userId: supplier.user?.id ?? supplier.userId ?? null,
              businessName: supplier.businessName ?? null,
              tradingAs: supplier.tradingAs ?? null,
            } as LimitedSupplier)
          : null,
      };
    });

    return { data: sanitizedData, meta: { total, page, limit } };
  }

  async acceptQuote(userId: string, quoteId: string) {
    const result = await this.offers.manager.transaction(
      async (entityManager) => {
        const quoteRepo = entityManager.getRepository(Quote);
        const requestRepo = entityManager.getRepository(QuoteRequest);
        const orderRepo = entityManager.getRepository(Order);
        const notificationRepo =
          entityManager.getRepository(SupplierQuoteNotification);

        const quote = await quoteRepo.findOne({
          where: { id: quoteId },
          relations: ['quoteRequest', 'quoteRequest.user', 'supplier'],
        });
        if (!quote) throw new NotFoundException('Quote not found');
        if (quote.quoteRequest.user.id !== userId) {
          throw new ForbiddenException('You cannot accept this quote');
        }
        if (quote.status !== QuoteStatus.PENDING) {
          throw new BadRequestException('Quote is no longer available');
        }

        const request = quote.quoteRequest;
        if (
          request.status === QuoteRequestStatus.EXPIRED ||
          request.status === QuoteRequestStatus.CONVERTED
        ) {
          throw new BadRequestException(
            'Quote request is no longer accepting offers',
          );
        }

        quote.status = QuoteStatus.ACCEPTED;
        request.status = QuoteRequestStatus.CONVERTED;

        const order = orderRepo.create({
          request,
          supplier: quote.supplier,
          acceptedQuote: quote,
          buyer: request.user,
          status: OrderStatus.PENDING_DELIVERY,
        });

        await quoteRepo.save(quote);
        await requestRepo.save(request);

        await quoteRepo
          .createQueryBuilder()
          .update(Quote)
          .set({ status: QuoteStatus.EXPIRED })
          .where('"quoteRequestId" = :requestId', { requestId: request.id })
          .andWhere('"id" != :quoteId', { quoteId: quote.id })
          .execute();

        await notificationRepo
          .createQueryBuilder()
          .update(SupplierQuoteNotification)
          .set({ status: SupplierNotificationStatus.REJECTED })
          .where('"requestId" = :requestId', { requestId: request.id })
          .andWhere('"supplierId" != :supplierId', {
            supplierId: quote.supplier.id,
          })
          .execute();

        await notificationRepo
          .createQueryBuilder()
          .update(SupplierQuoteNotification)
          .set({
            status: SupplierNotificationStatus.ACCEPTED,
            quotedAt: () => 'COALESCE("quotedAt", NOW())',
          })
          .where('"requestId" = :requestId', { requestId: request.id })
          .andWhere('"supplierId" = :supplierId', {
            supplierId: quote.supplier.id,
          })
          .execute();

        const savedOrder = await orderRepo.save(order);
        return {
          orderId: savedOrder.id,
          requestSnapshot: request,
        };
      },
    );

    const order = await this.orders.findOne({
      where: { id: result.orderId },
      relations: ['request', 'supplier', 'acceptedQuote', 'buyer'],
    });
    if (result.requestSnapshot) {
      this.sockets.emitUpdated({
        requestId: result.requestSnapshot.id,
        status: result.requestSnapshot.status,
        postCode: result.requestSnapshot.postcode,
        serviceCategories: result.requestSnapshot.services || [],
        updatedAt: new Date(),
      });
    }
    return order;
  }
}
