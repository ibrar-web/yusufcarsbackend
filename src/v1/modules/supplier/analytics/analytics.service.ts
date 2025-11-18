import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Quote } from '../../quotes/quote.entity';
import { QuoteRequest } from '../../quotes/quote-request.entity';

type Range = { from?: string; to?: string };

@Injectable()
export class SupplierAnalyticsService {
  constructor(
    @InjectRepository(Quote) private readonly quotes: Repository<Quote>,
    @InjectRepository(QuoteRequest) private readonly requests: Repository<QuoteRequest>,
  ) {}

  async summary(range: Range) {
    const whereRange = this.buildRange(range);
    const [totalQuotes, acceptedQuotes, pendingRequests] = await Promise.all([
      this.quotes.count({ where: whereRange }),
      this.quotes.count({ where: { ...whereRange, status: 'accepted' } as any }),
      this.requests.count({ where: { ...whereRange, status: 'pending' } as any }),
    ]);
    const revenue = await this.revenue(range);

    return {
      totalQuotes,
      acceptedQuotes,
      pendingRequests,
      revenue,
    };
  }

  private async revenue(range: Range) {
    const accepted = await this.quotes.find({ where: { ...this.buildRange(range), status: 'accepted' } as any });
    const totalRevenue = accepted.reduce((sum, q) => sum + Number(q.price), 0);
    return { totalRevenue, count: accepted.length };
  }

  private buildRange(range: Range) {
    if (range.from && range.to) return { createdAt: Between(new Date(range.from), new Date(range.to)) };
    if (range.from) return { createdAt: Between(new Date(range.from), new Date()) };
    return {};
  }
}
