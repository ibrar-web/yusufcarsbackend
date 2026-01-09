import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../../../entities/quotes/order.entity';
import { User } from '../../../entities/user.entity';

@Injectable()
export class SupplierReportsService {
  private readonly logger = new Logger(SupplierReportsService.name);

  constructor(
    @InjectRepository(Order) private readonly orders: Repository<Order>,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async getReportedOrders(userId: string) {
    const user = await this.users.findOne({
      where: { id: userId },
      relations: { supplier: true },
    });
    if (!user?.supplier) {
      throw new NotFoundException('Supplier profile not found');
    }
    try {
      const data = await this.orders
        .createQueryBuilder('order')
        .leftJoin('order.acceptedQuote', 'acceptedQuote')
        .leftJoin('order.buyer', 'buyer')
        .select([
          'order',
          // 'buyer',
          'acceptedQuote.id',
          'acceptedQuote.partName',
          'buyer.id',
          'buyer.firstName',
          'buyer.lastName',
          'buyer.email'
        ])
        .where('order.supplierId = :supplierId', { supplierId: user.id })
        .andWhere('order.status = :status', { status: OrderStatus.REPORTED })
        .orderBy('order.createdAt', 'DESC')
        .getMany();
      return data;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }
}
