import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import { QuoteOfferReceivedPayload } from './dto/quote-offer-received.payload';
import { QuoteOfferUpdatedPayload } from './dto/quote-offer-updated.payload';

type QuoteOfferSocketPayload =
  | ({ type: 'received' } & QuoteOfferReceivedPayload)
  | ({ type: 'updated' } & QuoteOfferUpdatedPayload);

@Injectable()
export class QuoteOfferSocketService {
  private readonly logger = new Logger(QuoteOfferSocketService.name);
  private server?: Server;

  attachServer(server: Server) {
    this.server = server;
  }

  emitOffer(payload: QuoteOfferSocketPayload) {
    if (!this.server) {
      this.logger.warn('Quote offer socket not initialized');
      return;
    }

    const dto = this.normalizePayload(payload);
    console.log('offer dto :', dto, payload);
    this.server
      .to(QuoteOfferSocketService.roomForUser(payload.userId))
      .emit('quote:offer', dto);
  }

  emitOfferAccepted(payload: QuoteOfferUpdatedPayload) {
    if (!this.server) {
      this.logger.warn('Quote offer socket not initialized');
      return;
    }
    const dto = this.normalizePayload({
      type: 'updated',
      ...payload,
    });
    this.server
      .to(QuoteOfferSocketService.roomForUser(payload.userId))
      .emit('quote:offer:accepted', dto);
  }

  static roomForUser(userId: string) {
    return `quote-offer:user:${userId}`;
  }

  private normalizePayload(payload: QuoteOfferSocketPayload) {
    if (payload.type === 'received') {
      const { userId: _userId, ...rest } = payload;
      void _userId;
      return {
        ...rest,
        createdAt:
          payload.createdAt instanceof Date
            ? payload.createdAt.toISOString()
            : payload.createdAt,
        updatedAt:
          payload.updatedAt instanceof Date
            ? payload.updatedAt.toISOString()
            : payload.updatedAt,
      };
    }
    const { userId: _userId, ...rest } = payload;
    void _userId;
    return {
      ...rest,
      updatedAt:
        payload.updatedAt instanceof Date
          ? payload.updatedAt.toISOString()
          : payload.updatedAt,
    };
  }
}
