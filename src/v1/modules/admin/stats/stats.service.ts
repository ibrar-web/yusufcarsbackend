import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { User } from '../../../entities/user.entity';
import { Supplier } from '../../../entities/supplier.entity';
import { QuoteRequest } from '../../../entities/quotes/quote-request.entity';
import { QuoteOffer } from '../../../entities/quote-offers.entity';

@Injectable()
export class AdminStatsService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Supplier)
    private readonly suppliers: Repository<Supplier>,
    @InjectRepository(QuoteRequest)
    private readonly enquiries: Repository<QuoteRequest>,
    @InjectRepository(QuoteOffer)
    private readonly quotes: Repository<QuoteOffer>,
  ) {}

  async dashboard() {
    const [totalUsers, totalSuppliers, totalEnquiries] = await Promise.all([
      this.users.count(),
      this.suppliers.count(),
      this.enquiries.count(),
    ]);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const enquiriesThisMonth = await this.enquiries.count({
      where: { createdAt: Between(startOfMonth, now) },
    });

    const revenueMetrics = await this.revenueSummary();

    return {
      totalUsers,
      totalSuppliers,
      totalEnquiries,
      enquiriesThisMonth,
      revenue: revenueMetrics,
    };
  }

  private async revenueSummary() {
    const acceptedQuotes = await this.quotes.find({
      where: { status: 'accepted' },
    });
    const totalRevenue = acceptedQuotes.reduce(
      (sum, q) => sum + Number(q.price),
      0,
    );
    return { totalRevenue, acceptedQuotes: acceptedQuotes.length };
  }
}
