import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { User } from '../../../entities/user.entity';
import { Supplier } from '../../../entities/supplier.entity';
import { QuoteRequest } from '../../../entities/quotes/quote-request.entity';
import { QuoteOffer } from '../../../entities/quote-offers.entity';

type DateFilter = { from?: string; to?: string };

@Injectable()
export class AdminReportsService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Supplier)
    private readonly suppliers: Repository<Supplier>,
    @InjectRepository(QuoteRequest)
    private readonly enquiries: Repository<QuoteRequest>,
    @InjectRepository(QuoteOffer)
    private readonly quotes: Repository<QuoteOffer>,
  ) {}

  async summary(filter: DateFilter) {
    const range = this.buildRange(filter);
    const [userCount, supplierCount, enquiryCount, quoteCount] =
      await Promise.all([
        this.users.count({ where: range }),
        this.suppliers.count({ where: range }),
        this.enquiries.count({ where: range }),
        this.quotes.count({ where: range }),
      ]);
    return { userCount, supplierCount, enquiryCount, quoteCount };
  }

  async detailed(filter: DateFilter) {
    const where = this.buildRange(filter);
    const enquiries = await this.enquiries.find({
      where,
      order: { createdAt: 'DESC' },
      take: 100,
    });
    const quotes = await this.quotes.find({
      where,
      order: { createdAt: 'DESC' },
      take: 100,
    });
    return { enquiries, quotes };
  }

  async export(format: 'csv' | 'pdf', filter: DateFilter) {
    const data = await this.detailed(filter);
    return {
      format,
      exportedAt: new Date().toISOString(),
      filter,
      data,
      note: 'Attach actual file generation here (stream/buffer) when implementing exports.',
    };
  }

  private buildRange(filter: DateFilter) {
    const { from, to } = filter;
    if (from && to) return { createdAt: Between(new Date(from), new Date(to)) };
    if (from) return { createdAt: Between(new Date(from), new Date()) };
    return {};
  }
}
