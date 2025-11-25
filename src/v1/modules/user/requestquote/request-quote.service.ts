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
import { QUOTE_REQUEST_LIFETIME_MS } from './request-quote.constants';

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

    const expiresAt = this.calculateExpiry(dto.expiresAt);

    const request = this.quoteRequests.create({
      user,
      model: dto.model,
      make: dto.make,
      registrationNumber: dto.registrationNumber,
      taxStatus: dto.taxStatus,
      taxDueDate: dto.taxDueDate,
      motStatus: dto.motStatus,
      yearOfManufacture: dto.yearOfManufacture,
      fuelType: dto.fuelType,
      engineSize: dto.engineSize,
      engineCapacity: dto.engineCapacity,
      co2Emissions: dto.co2Emissions,
      services: dto.services,
      postcode: dto.postcode ?? user.postCode,
      markedForExport: dto.markedForExport ?? false,
      colour: dto.colour,
      typeApproval: dto.typeApproval,
      revenueWeight: dto.revenueWeight,
      dateOfLastV5CIssued: dto.dateOfLastV5CIssued,
      motExpiryDate: dto.motExpiryDate,
      wheelplan: dto.wheelplan,
      monthOfFirstRegistration: dto.monthOfFirstRegistration,
      requestType: dto.requestType ?? 'local',
      expiresAt,
    });
    return this.quoteRequests.save(request);
  }

  private calculateExpiry(value?: string | Date) {
    const maxExpiry = new Date(Date.now() + QUOTE_REQUEST_LIFETIME_MS);
    if (!value) return maxExpiry;
    const parsed = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('Invalid expiresAt value');
    }
    return parsed > maxExpiry ? maxExpiry : parsed;
  }
}
