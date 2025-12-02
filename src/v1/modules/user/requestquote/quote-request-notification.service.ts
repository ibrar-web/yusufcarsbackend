import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupplierApprovalStatus } from '../../../entities/supplier.entity';
import { User, UserStatus } from '../../../entities/user.entity';
import {
  SupplierQuoteNotification,
  SupplierNotificationStatus,
} from '../../../entities/quotes/supplier-quote-notification.entity';
import { QuoteRequest } from '../../../entities/quotes/quote-request.entity';
import { QUOTE_REQUEST_LIFETIME_MS } from './request-quote.constants';
import { QuoteRequestSocketService } from '../../sockets/quote-requests/quote-request-socket.service';
import { QuoteRequestCreatedPayload } from '../../sockets/quote-requests/dto/quote-request-created.payload';

const LOCAL_RADIUS_MILES = 5;

@Injectable()
export class QuoteRequestNotificationService {
  private readonly logger = new Logger(QuoteRequestNotificationService.name);

  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(SupplierQuoteNotification)
    private readonly notifications: Repository<SupplierQuoteNotification>,
    private readonly sockets: QuoteRequestSocketService,
  ) {}

  async distribute(request: QuoteRequest) {
    const suppliers = await this.findSupplierUsersForRequest(request);
    if (!suppliers.length) {
      this.logger.debug(
        `No supplier matches found for quote request ${request.id}`,
      );
      return;
    }
    const expiresAt =
      request.expiresAt || new Date(Date.now() + QUOTE_REQUEST_LIFETIME_MS);
    const notificationEntities = suppliers.map((supplier) =>
      this.notifications.create({
        request,
        supplier,
        expiresAt,
        status: SupplierNotificationStatus.PENDING,
      }),
    );
    const saved = await this.notifications.save(notificationEntities);
    const supplierIds = saved.map((notification) => notification.supplierId);
    const payload = this.buildSocketPayload(request);
    if (payload && supplierIds.length) {
      this.sockets.emitCreatedForSuppliers(payload, supplierIds);
    }
  }

  private async findSupplierUsersForRequest(request: QuoteRequest) {
    const isLocal = request.requestType === 'local';
    if (isLocal && (!request.latitude || !request.longitude)) {
      this.logger.warn(
        `Quote request ${request.id} marked as local but lacks coordinates`,
      );
      return [];
    }
    const qb = this.users
      .createQueryBuilder('user')
      .innerJoinAndSelect('user.supplier', 'supplier')
      .where('user.role = :role', { role: 'supplier' })
      .andWhere('user.status = :status', { status: UserStatus.ACTIVE })
      .andWhere('supplier.approvalStatus = :approved', {
        approved: SupplierApprovalStatus.APPROVED,
      });
    if (isLocal) {
      qb.andWhere('user.latitude IS NOT NULL AND user.longitude IS NOT NULL');
    }
    const candidates = await qb.getMany();
    if (!isLocal) {
      return candidates;
    }
    const matches: User[] = [];
    for (const supplier of candidates) {
      const lat = supplier.latitude;
      const lon = supplier.longitude;
      if (typeof lat !== 'number' || typeof lon !== 'number') continue;
      const distance = this.haversineMiles(
        request.latitude!,
        request.longitude!,
        lat,
        lon,
      );
      if (distance <= LOCAL_RADIUS_MILES) {
        matches.push(supplier);
      }
    }
    return matches;
  }

  private haversineMiles(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ) {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const earthRadiusMiles = 3958.8;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusMiles * c;
  }

  private buildSocketPayload(
    request: QuoteRequest,
  ): QuoteRequestCreatedPayload | null {
    if (!request.user) return null;
    return {
      requestId: request.id,
      userId: request.user.id,
      postCode: request.postcode,
      serviceCategories: request.services || [],
      createdAt: request.createdAt,
    };
  }
}
