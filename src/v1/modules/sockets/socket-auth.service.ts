import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Socket } from 'socket.io';
import { Repository } from 'typeorm';
import { Supplier } from '../../entities/supplier.entity';
import { JoseService } from '../auth/jose.service';
import { SocketUserContext, SocketUserRole } from './socket.types';

type TokenPayload = {
  sub: string;
  role?: SocketUserRole;
  [key: string]: unknown;
};

@Injectable()
export class SocketAuthService {
  constructor(
    private readonly jose: JoseService,
    @InjectRepository(Supplier)
    private readonly suppliers: Repository<Supplier>,
  ) {}

  async authenticate(client: Socket): Promise<SocketUserContext> {
    const token = this.extractToken(client);
    if (!token) throw new UnauthorizedException('Missing WS token');

    let payload: TokenPayload;
    try {
      payload = (await this.jose.verify(token)) as TokenPayload;
    } catch {
      throw new UnauthorizedException('Invalid WS token');
    }

    const userId = payload.sub;
    const role = this.resolveRole(payload);
    if (!userId || !role) {
      throw new UnauthorizedException('Invalid WS payload');
    }

    const context: SocketUserContext = { id: userId, role };

    if (role === 'supplier') {
      const supplier = await this.suppliers.findOne({
        where: { user: { id: userId } as any },
      });
      if (!supplier) {
        throw new UnauthorizedException('Supplier profile missing');
      }
      context.supplierId = supplier.id;
      context.supplierCategories = supplier.categories ?? [];
      context.supplierPostCode = supplier.postCode;
    }

    client.data.user = context;
    return context;
  }

  private extractToken(client: Socket) {
    const cookieName = process.env.COOKIE_NAME || 'access_token';
    const cookieHeader = client.handshake.headers.cookie ?? '';
    const fromCookie = cookieHeader
      .split(';')
      .map((chunk) => chunk.trim())
      .map((chunk) => chunk.split('='))
      .find(([key]) => key === cookieName)?.[1];

    const authHeader = client.handshake.headers.authorization ?? '';
    const fromHeader = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : undefined;

    const fromQuery =
      typeof client.handshake.query.token === 'string'
        ? client.handshake.query.token
        : undefined;

    const fromAuth =
      typeof client.handshake.auth?.token === 'string'
        ? client.handshake.auth.token
        : undefined;

    return fromCookie || fromHeader || fromQuery || fromAuth;
  }

  private resolveRole(payload: TokenPayload): SocketUserRole | undefined {
    if (payload.role === 'supplier') return 'supplier';
    if (payload.role === 'admin') return 'admin';
    return 'user';
  }
}
