import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Supplier } from '../../../entities/supplier.entity';
import {
  SupplierNotificationStatus,
  SupplierQuoteNotification,
} from '../../../entities/quotes/supplier-quote-notification.entity';

type ListParams = {
  page?: number;
  limit?: number;
  search?: string;
};

@Injectable()
export class SupplierQuotesService {
  constructor(
    @InjectRepository(Supplier)
    private readonly suppliers: Repository<Supplier>,
    @InjectRepository(SupplierQuoteNotification)
    private readonly supplierNotifications: Repository<SupplierQuoteNotification>,
  ) {}

  async listForSupplier(userId: string, params: ListParams) {
    const supplier = await this.findSupplier(userId);
    const supplierUserId = supplier.userId;

    const page = params.page && params.page > 0 ? params.page : 1;
    const limit =
      params.limit && params.limit > 0 ? Math.min(params.limit, 100) : 20;
    const skip = (page - 1) * limit;
    const search = params.search ? `%${params.search}%` : null;
    const qb = this.supplierNotifications
      .createQueryBuilder('notification')
      .leftJoinAndSelect('notification.request', 'request')
      .where('notification.supplierId = :supplierId', {
        supplierId: supplierUserId,
      })
      .andWhere(
        'notification.status IN (:...statuses)',
        {
          statuses: [SupplierNotificationStatus.PENDING],
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

    const data = notifications.map((notification) => ({
      id: notification.request.id,
      make: notification.request.make,
      model: notification.request.model,
      services: notification.request.services,
      registrationNumber: notification.request.registrationNumber,
      postcode: notification.request.postcode,
      createdAt: notification.request.createdAt,
      supplierNotification: notification,
    }));

    return { data, meta: { total, page, limit } };
  }

  async detail(userId: string, requestId: string) {
    const supplier = await this.findSupplier(userId);
    const notification = await this.supplierNotifications.findOne({
      where: {
        supplier: { id: supplier.userId } as any,
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
