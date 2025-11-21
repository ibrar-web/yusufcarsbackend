import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { QuoteRequest } from '../../../entities/quote-request.entity';
import { User } from '../../../entities/user.entity';
import { CreateRequestQuoteDto } from './dto/create-request-quote.dto';

type QuoteRequestStatus = QuoteRequest['status'];

@Injectable()
export class UserRequestQuoteService {
  constructor(
    @InjectRepository(QuoteRequest)
    private readonly quoteRequests: Repository<QuoteRequest>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  async list(userId: string, status?: QuoteRequestStatus) {
    const where: FindOptionsWhere<QuoteRequest> = {
      user: { id: userId } as any,
      ...(status ? { status } : {}),
    };
    return this.quoteRequests.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async detail(userId: string, id: string) {
    const request = await this.quoteRequests.findOne({
      where: { id, user: { id: userId } as any },
      relations: ['quotes'],
    });
    if (!request) throw new NotFoundException('Quote request not found');
    return request;
  }

  async create(userId: string, dto: CreateRequestQuoteDto) {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const expiresAt = dto.expiresAt
      ? this.parseExpiry(dto.expiresAt)
      : this.defaultExpiry();

    const request = this.quoteRequests.create({
      user,
      maker: dto.maker,
      model: dto.model,
      year: dto.year,
      fuelType: dto.fuelType,
      engineSize: dto.engineSize,
      services: dto.services,
      postcode: dto.postcode ?? user.postCode,
      requireFitment: dto.requireFitment ?? false,
      requestType: dto.requestType ?? 'local',
      expiresAt,
    });
    return this.quoteRequests.save(request);
  }

  private parseExpiry(value: string | Date) {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Invalid expiresAt value');
    }
    return date;
  }

  private defaultExpiry() {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    return expiresAt;
  }
}
