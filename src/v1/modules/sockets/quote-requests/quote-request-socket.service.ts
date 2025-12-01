import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { QuoteRequestCreatedPayload } from './dto/quote-request-created.payload';
import { QuoteRequestUpdatedPayload } from './dto/quote-request-updated.payload';

@Injectable()
export class QuoteRequestSocketService {
  private readonly logger = new Logger(QuoteRequestSocketService.name);
  private server?: Server;
  private readonly connections = new Map<string, string>();

  attachServer(server: Server) {
    this.server = server;
  }

  registerSupplier(client: Socket, supplierId: string) {
    this.connections.set(client.id, supplierId);
    client.join(this.roomForSupplier(supplierId));
  }

  unregisterClient(socketId: string) {
    this.connections.delete(socketId);
  }

  emitCreated(payload: QuoteRequestCreatedPayload) {
    if (!this.server) {
      this.logger.warn('Quote request socket not initialized');
      return;
    }
    const dto = this.normalizeCreatedPayload(payload);
    this.server.emit('quote:request:created', dto);
  }

  emitUpdated(payload: QuoteRequestUpdatedPayload) {
    if (!this.server) {
      this.logger.warn('Quote request socket not initialized');
      return;
    }
    const dto = this.normalizeUpdatedPayload(payload);
    this.server.emit('quote:request:updated', dto);
  }

  private roomForSupplier(supplierId: string) {
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
