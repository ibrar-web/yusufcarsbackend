import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import { QuoteRequestCreatedPayload } from './dto/quote-request-created.payload';
import { QuoteRequestUpdatedPayload } from './dto/quote-request-updated.payload';

type QuoteRequestSocketPayload =
  | ({ type: 'created' } & QuoteRequestCreatedPayload)
  | ({ type: 'updated' } & QuoteRequestUpdatedPayload);

@Injectable()
export class QuoteRequestSocketService {
  private readonly logger = new Logger(QuoteRequestSocketService.name);
  private server?: Server;

  attachServer(server: Server) {
    this.server = server;
  }

  emit(payload: QuoteRequestSocketPayload, supplierIds: string[]) {
    if (!this.server) {
      this.logger.warn('Quote request socket not initialized');
      return;
    }
    const dto = this.normalizePayload(payload);
    if (!supplierIds?.length) {
      this.logger.warn('Quote request emit invoked without supplier targets');
      return;
    }
    for (const supplierId of supplierIds) {
      console.log('supplierId', supplierId);
      this.server
        .to(QuoteRequestSocketService.roomForSupplier(supplierId))
        .emit('quote:request', dto);
    }
  }

  static roomForSupplier(supplierId: string) {
    return `quote-request:supplier:${supplierId}`;
  }

  private normalizePayload(payload: QuoteRequestSocketPayload) {
    if (payload.type === 'created') {
      return {
        ...payload,
        createdAt:
          payload.createdAt instanceof Date
            ? payload.createdAt.toISOString()
            : payload.createdAt,
      };
    }
    return {
      ...payload,
      updatedAt:
        payload.updatedAt instanceof Date
          ? payload.updatedAt.toISOString()
          : payload.updatedAt,
    };
  }
}
