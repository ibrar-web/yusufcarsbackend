import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Socket } from 'socket.io';
import { SocketAuthService } from './socket-auth.service';

@Injectable()
export class SocketAuthGuard implements CanActivate {
  constructor(private readonly auth: SocketAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<Socket>();
    if (!client) throw new UnauthorizedException();
    await this.auth.authenticate(client);
    return true;
  }
}
