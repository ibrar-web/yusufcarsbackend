import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { QuoteRequest } from '../../../entities/quotes/quote-request.entity';
import { Supplier } from '../../../entities/supplier.entity';
import { SupplierQuoteNotification } from '../../../entities/quotes/supplier-quote-notification.entity';

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
    @InjectRepository(Supplier)
    private readonly suppliers: Repository<Supplier>,
    @InjectRepository(SupplierQuoteNotification)
    private readonly supplierNotifications: Repository<SupplierQuoteNotification>,
  ) {}

  async listForSupplier(userId: string, params: ListParams) {
    const supplier = await this.findSupplier(userId);

    const page = params.page && params.page > 0 ? params.page : 1;
    const limit =
      params.limit && params.limit > 0 ? Math.min(params.limit, 100) : 20;
    const skip = (page - 1) * limit;
    const search = params.search ? `%${params.search}%` : null;
    const qb = this.supplierNotifications
      .createQueryBuilder('notification')
      .leftJoinAndSelect('notification.request', 'request')
      .leftJoinAndSelect('request.user', 'user')
      .leftJoinAndSelect('request.quotes', 'allQuotes')
      .where('notification.supplierId = :supplierId', {
        supplierId: supplier.id,
      })
      .andWhere(
        'notification.status IN (:...statuses)',
        {
          statuses: ['pending', 'quoted'],
        },
      )
      .andWhere('notification."expiresAt" > :now', { now: new Date() });

    if (search) {
      qb.andWhere(
        new Brackets((expr) => {
          expr
            .where('request.make ILIKE :search', { search })
            .orWhere('request.model ILIKE :search', { search });
        }),
      );
    }

    const [notifications, total] = await qb
      .orderBy('notification.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const data = notifications.map((notification) => {
      const request = notification.request;
      return {
        ...request,
        supplierNotification: notification,
      } as QuoteRequest & {
        supplierNotification: SupplierQuoteNotification;
      };
    });

    return { data, meta: { total, page, limit } };
  }

  async detail(userId: string, requestId: string) {
    const supplier = await this.findSupplier(userId);
    const notification = await this.supplierNotifications.findOne({
      where: {
        supplier: { id: supplier.id } as any,
        request: { id: requestId } as any,
      },
      relations: ['request', 'request.user', 'request.quotes'],
    });
    if (!notification) {
      throw new NotFoundException('Quote request not found');
    }
    return {
      ...notification.request,
      supplierNotification: notification,
    };
  }

  private async findSupplier(userId: string) {
    const supplier = await this.suppliers.findOne({
      where: { user: { id: userId } as any },
      relations: ['user'],
    });
    if (!supplier) {
      throw new NotFoundException('Supplier profile not found');
    }
    return supplier;
  }
}
