import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtCookieStrategy } from '../strategies/jwt-cookie.strategy';

@Injectable()
export class JwtCookieGuard implements CanActivate {
  constructor(private readonly strategy: JwtCookieStrategy) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const token = this.strategy.extractToken(req);
    if (!token) {
      throw new UnauthorizedException('Missing access token');
    }
    try {
      const payload = await this.strategy.validate(token);
      (req as any).user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
