import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { validatePayload } from '../socket-validation';
import { SocketConnectionRegistry } from '../socket-connection.registry';
import { QuoteRequestCreatedPayload } from './dto/quote-request-created.payload';
import { QuoteRequestUpdatedPayload } from './dto/quote-request-updated.payload';

@Injectable()
export class QuoteRequestSocketService {
  private readonly logger = new Logger(QuoteRequestSocketService.name);
  private server?: Server;

  constructor(private readonly registry: SocketConnectionRegistry) {}

  attachServer(server: Server) {
    this.server = server;
  }

  registerSupplierRoom(client: Socket, supplierId?: string) {
    if (supplierId) {
      client.join(this.roomForSupplier(supplierId));
    }
  }

  emitCreated(payload: QuoteRequestCreatedPayload) {
    if (!this.server) {
      this.logger.warn('Quote request server missing');
      return;
    }
    const dto = validatePayload(QuoteRequestCreatedPayload, payload);
    const targetSockets = this.registry.supplierSocketsFor({
      postCode: dto.postCode,
      categories: dto.serviceCategories,
    });
    if (!targetSockets.length) return;
    this.server.to(targetSockets).emit('quote:request:created', dto);
  }

  emitUpdated(payload: QuoteRequestUpdatedPayload) {
    if (!this.server) {
      this.logger.warn('Quote request server missing');
      return;
    }
    const dto = validatePayload(QuoteRequestUpdatedPayload, payload);
    const shouldFilter =
      (dto.postCode && dto.postCode.length > 0) ||
      (dto.serviceCategories && dto.serviceCategories.length > 0);
    if (shouldFilter) {
      const targets = this.registry.supplierSocketsFor({
        postCode: dto.postCode,
        categories: dto.serviceCategories,
      });
      if (targets.length) {
        this.server.to(targets).emit('quote:request:updated', dto);
        return;
      }
    }
    this.server.emit('quote:request:updated', dto);
  }

  private roomForSupplier(supplierId: string) {
    return `quote-request:supplier:${supplierId}`;
  }
}
