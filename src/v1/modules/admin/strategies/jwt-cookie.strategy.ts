import { Injectable } from '@nestjs/common';
import { JoseService } from '../../auth/jose.service';

@Injectable()
export class JwtCookieStrategy {
  constructor(private readonly jose: JoseService) {}

  extractToken(req: any): string | undefined {
    const cookieName = process.env.COOKIE_NAME || 'access_token';
    const tokenFromCookie = req?.cookies?.[cookieName];
    const authHeader: string | undefined = req?.headers?.authorization;
    const headerToken =
      authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.slice('Bearer '.length)
        : undefined;
    return tokenFromCookie || headerToken;
  }

  async validate(token: string) {
    return this.jose.verify(token);
  }
}
