import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, In, Repository } from 'typeorm';
import {
  QuoteRequest,
  QuoteRequestAttachment,
} from '../../../entities/quotes/quote-request.entity';
import { User } from '../../../entities/user.entity';
import { CreateRequestQuoteDto } from './dto/create-request-quote.dto';
import { QUOTE_REQUEST_LIFETIME_MS } from './request-quote.constants';
import { QuoteRequestNotificationService } from './quote-request-notification.service';
import { GoogleGeocodingService } from '../../../common/geocoding/google-geocoding.service';
import { ServiceItem } from '../../../entities/services/service-item.entity';
import type { Express } from 'express';
import { S3Service } from '../../../common/aws/s3.service';

type QuoteRequestStatus = QuoteRequest['status'];

@Injectable()
export class UserRequestQuoteService {
  private readonly logger = new Logger(UserRequestQuoteService.name);

  constructor(
    @InjectRepository(QuoteRequest)
    private readonly quoteRequests: Repository<QuoteRequest>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(ServiceItem)
    private readonly serviceItems: Repository<ServiceItem>,
    private readonly notifications: QuoteRequestNotificationService,
    private readonly geocoding: GoogleGeocodingService,
    private readonly s3: S3Service,
  ) {}

  async list(userId: string, status?: QuoteRequestStatus) {
    const where: FindOptionsWhere<QuoteRequest> = {
      user: { id: userId },
      ...(status ? { status } : {}),
    };
    return this.quoteRequests.find({
      where,
      order: { createdAt: 'DESC' },
      relations: ['serviceItems'],
    });
  }

  async detail(userId: string, id: string) {
    const request = await this.quoteRequests.findOne({
      where: { id, user: { id: userId } },
      relations: ['quotes', 'serviceItems'],
    });
    if (!request) throw new NotFoundException('Quote request not found');
    return request;
  }

  async create(
    userId: string,
    dto: CreateRequestQuoteDto,
    images?: Express.Multer.File[],
  ) {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const resolvedPostcode = dto.postcode ?? user.postCode ?? '';
    const targetPostcode = resolvedPostcode.trim();
    if (!targetPostcode) {
      throw new BadRequestException('Postcode is required to create a request');
    }

    const coordinates =
      (await this.lookupCoordinates(targetPostcode)) ||
      (user.latitude && user.longitude
        ? { latitude: user.latitude, longitude: user.longitude }
        : undefined);
    if (dto.requestType === 'local' && !coordinates) {
      throw new BadRequestException(
        'Local quote requests require a valid postcode with known coordinates.',
      );
    }
    const expiresAt = this.calculateExpiry(dto.expiresAt);

    let serviceItemEntities: ServiceItem[] = [];
    if (dto.services?.length) {
      serviceItemEntities = await this.serviceItems.find({
        where: { id: In(dto.services) },
      });
      if (serviceItemEntities.length !== dto.services.length) {
        throw new BadRequestException(
          'One or more service items were not found',
        );
      }
    }

    const attachments = await this.uploadAttachments(userId, images);

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
      serviceItems: serviceItemEntities,
      postcode: targetPostcode,
      markedForExport: dto.markedForExport ?? false,
      colour: dto.colour,
      typeApproval: dto.typeApproval,
      revenueWeight: dto.revenueWeight,
      dateOfLastV5CIssued: dto.dateOfLastV5CIssued,
      motExpiryDate: dto.motExpiryDate,
      wheelplan: dto.wheelplan,
      monthOfFirstRegistration: dto.monthOfFirstRegistration,
      requestType: dto.requestType,
      expiresAt,
      latitude: coordinates?.latitude,
      longitude: coordinates?.longitude,
      attachments,
    });
    const saved = await this.quoteRequests.save(request);
    saved.serviceItems = serviceItemEntities;
    saved.user = user;
    await this.notifications.distribute(saved);
    return saved;
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

  private async lookupCoordinates(postCode: string) {
    try {
      return await this.geocoding.lookupPostcode(postCode);
    } catch (error) {
      this.logger.error(
        `Failed to lookup coordinates for ${postCode}`,
        error instanceof Error ? error.stack : undefined,
      );
      return null;
    }
  }

  private async uploadAttachments(
    userId: string,
    files?: Express.Multer.File[],
  ): Promise<QuoteRequestAttachment[] | null> {
    if (!files?.length) {
      return null;
    }
    const uploads = await Promise.all(
      files.slice(0, 6).map(async (file) => {
        const key = `quote-requests/${userId}/${Date.now()}-${
          file.originalname ?? 'attachment'
        }`;
        const url = await this.s3.uploadPublic(key, {
          buffer: file.buffer,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
        });
        return {
          key,
          url,
          mimeType: file.mimetype,
          originalName: file.originalname,
          size: file.size,
          uploadedAt: new Date().toISOString(),
        };
      }),
    );
    return uploads;
  }
}
