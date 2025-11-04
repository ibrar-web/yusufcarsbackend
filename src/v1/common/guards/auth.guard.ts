import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { JoseService } from '../../modules/auth/jose.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jose: JoseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const cookieName = process.env.COOKIE_NAME || 'access_token';
    const tokenFromCookie = (req as any).cookies?.[cookieName];
    const authHeader = req.headers.authorization || '';
    const tokenFromHeader = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    const token = tokenFromCookie || tokenFromHeader;

    if (!token) throw new UnauthorizedException('Missing token');
    try {
      const payload = await this.jose.verify(token);
      (req as any).user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}


