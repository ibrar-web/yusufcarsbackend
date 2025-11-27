import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import {
  SocketUserContext,
  SocketUserRole,
  SupplierFilterOptions,
} from './socket.types';

type ConnectionRecord = SocketUserContext & { socketId: string };

@Injectable()
export class SocketConnectionRegistry {
  private readonly connections = new Map<string, ConnectionRecord>();

  register(client: Socket, context: SocketUserContext) {
    this.connections.set(client.id, { socketId: client.id, ...context });
  }

  unregister(clientId: string) {
    this.connections.delete(clientId);
  }

  listByRole(role: SocketUserRole) {
    return Array.from(this.connections.values()).filter(
      (record) => record.role === role,
    );
  }

  supplierSocketsFor(filter: SupplierFilterOptions) {
    return this.listByRole('supplier')
      .filter((record) => {
        if (filter.postCode) {
          if (
            !record.supplierPostCode ||
            record.supplierPostCode.toLowerCase().slice(0, 2) !==
              filter.postCode.toLowerCase().slice(0, 2)
          ) {
            return false;
          }
        }
        if (filter.categories?.length) {
          const supplierCats = (record.supplierCategories ?? []).map((cat) =>
            cat.toLowerCase(),
          );
          return filter.categories.some((category) =>
            supplierCats.includes(category.toLowerCase()),
          );
        }
        return true;
      })
      .map((record) => record.socketId);
  }
}
