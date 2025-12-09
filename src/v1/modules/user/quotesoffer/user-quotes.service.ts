import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuoteOffer, QuoteStatus } from '../../../entities/quote-offers.entity';
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
import { QuoteOfferSocketService } from '../../sockets/quote-offers/quote-offer-socket.service';

type ListQupotesParams = {
  page?: number;
  limit?: number;
  status?: QuoteOffer['status'];
};

type LimitedSupplier = {
  id: string;
  email: string | null;
  fullName: string | null;
};

@Injectable()
export class UserQuotesService {
  private readonly logger = new Logger(UserQuotesService.name);
  constructor(
    @InjectRepository(QuoteOffer)
    private readonly offers: Repository<QuoteOffer>,
    @InjectRepository(Order)
    private readonly orders: Repository<Order>,
    private readonly sockets: QuoteRequestSocketService,
    private readonly quoteOfferSockets: QuoteOfferSocketService,
  ) {}

  async availableQuotes(userId: string, params: ListQupotesParams) {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit =
      params.limit && params.limit > 0 ? Math.min(params.limit, 100) : 20;
    const skip = (page - 1) * limit;
    const statusFilter = params.status ?? QuoteStatus.PENDING;

    const [data, total] = await this.offers.findAndCount({
      where: {
        quoteRequest: { user: { id: userId } },
        status: statusFilter,
      },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const sanitizedData = data.map((quote) => {
      const { supplier, quoteRequest, ...rest } = quote;
      const sanitizedQuoteRequest = quoteRequest ? { ...quoteRequest } : null;
      if (sanitizedQuoteRequest) {
        delete (sanitizedQuoteRequest as any).user;
      }
      return {
        ...rest,
        quoteRequestId: quoteRequest?.id ?? null,
        supplier: supplier
          ? ({
              id: supplier.id,
              email: supplier.email ?? null,
              fullName: supplier.fullName ?? null,
            } as LimitedSupplier)
          : null,
      };
    });

    return { data: sanitizedData, meta: { total, page, limit } };
  }

  async acceptQuoteOffer(userId: string, offerId: string) {
    const result = await this.offers.manager.transaction(
      async (entityManager) => {
        const quoteOfferRepo = entityManager.getRepository(QuoteOffer);
        const requestRepo = entityManager.getRepository(QuoteRequest);
        const orderRepo = entityManager.getRepository(Order);
        const notificationRepo = entityManager.getRepository(
          SupplierQuoteNotification,
        );

        const quote = await quoteOfferRepo.findOne({
          where: { id: offerId },
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
        if (request.status === QuoteRequestStatus.ACCEPTED) {
          throw new BadRequestException(
            'Quote request is no longer accepting offers',
          );
        }

        quote.status = QuoteStatus.ACCEPTED;
        request.status = QuoteRequestStatus.ACCEPTED;
        console.log('quote offer', quote);
        const order = orderRepo.create({
          request,
          supplier: quote.supplier,
          acceptedQuote: quote,
          buyer: request.user,
          status: OrderStatus.PENDING_DELIVERY,
        });

        await quoteOfferRepo.save(quote);
        await requestRepo.save(request);

        await quoteOfferRepo
          .createQueryBuilder()
          .update(QuoteOffer)
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

        const savedOrder = await orderRepo.save(order);
        const relatedNotifications = await notificationRepo.find({
          where: { request: { id: request.id } },
          relations: ['supplier'],
        });
        return {
          orderId: savedOrder.id,
          requestSnapshot: request,
          supplierIds: relatedNotifications
            .map(
              (notification) =>
                notification.supplierId ?? notification.supplier?.id,
            )
            .filter((id): id is string => Boolean(id)),
        };
      },
    );

    const order = await this.orders.findOne({
      where: { id: result.orderId },
      relations: ['request', 'supplier', 'acceptedQuote', 'buyer'],
    });
    if (order?.supplier && order.acceptedQuote) {
      this.quoteOfferSockets.emitOfferAccepted({
        offerId: order.acceptedQuote.id,
        userId: order.supplier.id,
        status: order.acceptedQuote.status,
        updatedAt: new Date(),
      });
    }
    if (result.requestSnapshot && result.supplierIds?.length) {
      this.sockets.emit(
        {
          type: 'updated',
          requestId: result.requestSnapshot.id,
          status: result.requestSnapshot.status,
          postCode: result.requestSnapshot.postcode,
          serviceCategories: result.requestSnapshot.services || [],
          updatedAt: new Date(),
        },
        result.supplierIds,
      );
    }
    return order;
  }
}
