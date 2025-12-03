import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import { QuoteRequestCreatedPayload } from './dto/quote-request-created.payload';
import { QuoteRequestUpdatedPayload } from './dto/quote-request-updated.payload';

@Injectable()
export class QuoteRequestSocketService {
  private readonly logger = new Logger(QuoteRequestSocketService.name);
  private server?: Server;

  attachServer(server: Server) {
    this.server = server;
  }

  emitCreated(payload: QuoteRequestCreatedPayload) {
    if (!this.server) {
      this.logger.warn('Quote request socket not initialized');
      return;
    }
    const dto = this.normalizeCreatedPayload(payload);
    this.server.emit('quote:request:created', dto);
  }

  emitCreatedForSuppliers(
    payload: QuoteRequestCreatedPayload,
    supplierIds: string[],
  ) {
    if (!this.server) {
      this.logger.warn('Quote request socket not initialized');
      return;
    }
    if (!supplierIds.length) return;
    const dto = this.normalizeCreatedPayload(payload);
    for (const supplierId of supplierIds) {
      this.server
        .to(QuoteRequestSocketService.roomForSupplier(supplierId))
        .emit('quote:request:created', dto);
    }
  }

  emitUpdated(payload: QuoteRequestUpdatedPayload) {
    if (!this.server) {
      this.logger.warn('Quote request socket not initialized');
      return;
    }
    const dto = this.normalizeUpdatedPayload(payload);
    this.server.emit('quote:request:updated', dto);
  }

  static roomForSupplier(supplierId: string) {
    return `quote-request:supplier:${supplierId}`;
  }

  private normalizeCreatedPayload(payload: QuoteRequestCreatedPayload) {
    return {
      ...payload,
      createdAt:
        payload.createdAt instanceof Date
          ? payload.createdAt.toISOString()
          : payload.createdAt,
    };
  }

  private normalizeUpdatedPayload(payload: QuoteRequestUpdatedPayload) {
    return {
      ...payload,
      updatedAt:
        payload.updatedAt instanceof Date
          ? payload.updatedAt.toISOString()
          : payload.updatedAt,
    };
  }
}
