import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { validatePayload } from '../socket-validation';
import { QuoteOfferReceivedPayload } from './dto/quote-offer-received.payload';
import { QuoteOfferUpdatedPayload } from './dto/quote-offer-updated.payload';
import { SocketUserContext } from '../socket.types';

@Injectable()
export class QuoteOfferSocketService {
  private readonly logger = new Logger(QuoteOfferSocketService.name);
  private server?: Server;

  attachServer(server: Server) {
    this.server = server;
  }

  registerClientRooms(client: Socket, user: SocketUserContext) {
    client.join(this.roomForUser(user.id));
  }

  emitOfferReceived(payload: QuoteOfferReceivedPayload) {
    if (!this.server) {
      this.logger.warn('Quote offer server missing');
      return;
    }
    const dto = validatePayload(QuoteOfferReceivedPayload, payload);
    this.server
      .to(this.roomForUser(dto.userId))
      .emit('quote:offer:received', dto);
  }

  emitOfferUpdated(payload: QuoteOfferUpdatedPayload) {
    if (!this.server) {
      this.logger.warn('Quote offer server missing');
      return;
    }
    const dto = validatePayload(QuoteOfferUpdatedPayload, payload);
    this.server
      .to(this.roomForUser(dto.userId))
      .emit('quote:offer:updated', dto);
  }

  private roomForUser(userId: string) {
    return `quote-offer:user:${userId}`;
  }
}
