import { Injectable } from '@nestjs/common';
import { JoseService } from '../../auth/jose.service';
import type {
  AuthenticatedUser,
  RequestWithAuth,
} from '../../../common/types/authenticated-user';

@Injectable()
export class JwtCookieStrategy {
  constructor(private readonly jose: JoseService) {}

  extractToken(req: RequestWithAuth): string | undefined {
    const cookieName = process.env.COOKIE_NAME || 'access_token';
    const tokenFromCookie = req.cookies?.[cookieName];
    const authHeader: string | undefined = req.headers?.authorization;
    const headerToken =
      authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.slice('Bearer '.length)
        : undefined;
    return tokenFromCookie || headerToken;
  }

  async validate(token: string): Promise<AuthenticatedUser> {
    return this.jose.verify<AuthenticatedUser>(token);
  }
}
