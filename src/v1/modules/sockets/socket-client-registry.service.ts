import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';

@Injectable()
export class SocketClientRegistry {
  private readonly logger = new Logger(SocketClientRegistry.name);
  private readonly connections = new Map<
    string,
    { identity: string; rooms: Set<string> }
  >();

  register(client: Socket, identity: string, rooms: string | string[]) {
    console.log('socket client:', client);
    const roomList = Array.isArray(rooms) ? rooms : [rooms];
    const existing = this.connections.get(client.id) ?? {
      identity,
      rooms: new Set<string>(),
    };
    existing.identity = identity;

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

  unregister(socketId: string) {
    this.connections.delete(socketId);
  }

  identityFor(socketId: string) {
    return this.connections.get(socketId)?.identity;
  }
}
