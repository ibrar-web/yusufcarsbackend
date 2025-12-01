import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { QuoteOfferReceivedPayload } from './dto/quote-offer-received.payload';
import { QuoteOfferUpdatedPayload } from './dto/quote-offer-updated.payload';

@Injectable()
export class QuoteOfferSocketService {
  private readonly logger = new Logger(QuoteOfferSocketService.name);
  private server?: Server;
  private readonly connections = new Map<string, string>();

  attachServer(server: Server) {
    this.server = server;
  }

  registerClient(client: Socket, userId: string) {
    this.connections.set(client.id, userId);
    client.join(this.roomForUser(userId));
  }

  unregisterClient(socketId: string) {
    this.connections.delete(socketId);
  }

  emitOfferReceived(payload: QuoteOfferReceivedPayload) {
    if (!this.server) {
      this.logger.warn('Quote offer socket not initialized');
      return;
    }
    const dto = this.normalizeReceived(payload);
    this.server.to(this.roomForUser(payload.userId)).emit('quote:offer:received', dto);
  }

  emitOfferUpdated(payload: QuoteOfferUpdatedPayload) {
    if (!this.server) {
      this.logger.warn('Quote offer socket not initialized');
      return;
    }
    const dto = this.normalizeUpdated(payload);
    this.server.to(this.roomForUser(payload.userId)).emit('quote:offer:updated', dto);
  }

  private roomForUser(userId: string) {
    return `quote-offer:user:${userId}`;
  }

  private normalizeReceived(payload: QuoteOfferReceivedPayload) {
    return {
      ...payload,
      createdAt:
        payload.createdAt instanceof Date
          ? payload.createdAt.toISOString()
          : payload.createdAt,
    };
  }

  private normalizeUpdated(payload: QuoteOfferUpdatedPayload) {
    return {
      ...payload,
      updatedAt:
        payload.updatedAt instanceof Date
          ? payload.updatedAt.toISOString()
          : payload.updatedAt,
    };
  }
}
