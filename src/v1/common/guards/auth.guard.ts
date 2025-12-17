import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JoseService } from '../../modules/auth/jose.service';
import type {
  AuthenticatedUser,
  RequestWithAuth,
} from '../types/authenticated-user';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jose: JoseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RequestWithAuth>();
    const cookieName = process.env.COOKIE_NAME || 'access_token';
    const tokenFromCookie = req.cookies?.[cookieName];
    const authHeaderValue =
      typeof req.headers.authorization === 'string'
        ? req.headers.authorization
        : '';
    const tokenFromHeader = authHeaderValue.startsWith('Bearer ')
      ? authHeaderValue.slice(7)
      : undefined;
    const token = tokenFromCookie || tokenFromHeader;

    if (!token) throw new UnauthorizedException('Missing token');
    try {
      const payload = await this.jose.verify<AuthenticatedUser>(token);
      req.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
