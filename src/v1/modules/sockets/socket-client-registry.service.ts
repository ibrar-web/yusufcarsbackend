import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { ChatSocketService } from './chat/chat-socket.service';
import { QuoteOfferSocketService } from './quote-offers/quote-offer-socket.service';
import { QuoteRequestSocketService } from './quote-requests/quote-request-socket.service';

type ConnectionMetadata = {
  userId?: string;
  supplierId?: string;
};

@Injectable()
export class SocketClientRegistry {
  private readonly logger = new Logger(SocketClientRegistry.name);
  private readonly connections = new Map<
    string,
    { identity: string; rooms: Set<string> } & ConnectionMetadata
  >();

  handleConnection(client: Socket) {
    const userId = this.extractId(client, 'userId');
    const supplierId = this.extractId(client, 'supplierId');

    if (!userId && !supplierId) {
      this.logger.warn('Socket connection rejected due to missing identifiers');
      return { success: false as const, reason: 'missingIdentifiers' as const };
    }

    const rooms = new Set<string>();
    if (userId) {
      rooms.add(ChatSocketService.roomForUser(userId));
      rooms.add(QuoteOfferSocketService.roomForUser(userId));
    }
    if (supplierId) {
      rooms.add(QuoteRequestSocketService.roomForSupplier(supplierId));
    }

    const identity = userId ?? supplierId!;
    this.register(client, identity, Array.from(rooms), {
      userId,
      supplierId,
    });

    return { success: true as const };
  }

  handleDisconnect(socketId: string) {
    this.unregister(socketId);
  }

  private register(
    client: Socket,
    identity: string,
    rooms: string | string[],
    metadata: ConnectionMetadata = {},
  ) {
    const roomList = Array.isArray(rooms) ? rooms : [rooms];
    const existing = this.connections.get(client.id) ?? {
      identity,
      rooms: new Set<string>(),
    };
    existing.identity = identity;
    existing.userId = metadata.userId ?? existing.userId;
    existing.supplierId = metadata.supplierId ?? existing.supplierId;

    for (const room of roomList) {
      if (!room) {
        this.logger.warn('Attempted to register a client without a room name');
        continue;
      }
      if (!existing.rooms.has(room)) {
        client.join(room);
        existing.rooms.add(room);
      }
    }

    this.connections.set(client.id, existing);
  }

  private unregister(socketId: string) {
    this.connections.delete(socketId);
  }

  identityFor(socketId: string) {
    return this.connections.get(socketId)?.identity;
  }

  private extractId(client: Socket, key: 'userId' | 'supplierId') {
    const raw = client.handshake.query[key];
    if (typeof raw === 'string' && raw.trim().length) {
      return raw.trim();
    }
    if (
      Array.isArray(raw) &&
      raw.length &&
      typeof raw[0] === 'string' &&
      raw[0].trim().length
    ) {
      return raw[0].trim();
    }
    if (raw !== undefined) {
      this.logger.warn(
        `Socket connection missing valid ${key} query parameter`,
      );
    }
    return undefined;
  }
}
