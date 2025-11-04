import { Body, Controller, Get, Post, Res, Req } from '@nestjs/common';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { JoseService } from './jose.service';

@Controller('/auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly jose: JoseService,
  ) {}

  @Post('register')
  async register(
    @Body()
    body: {
      email: string;
      password: string;
      fullName: string;
      role?: 'admin' | 'customer' | 'supplier' | 'garage';
      supplier?: any;
    },
  ) {
    return await this.auth.register(body);
  }

  @Post('login')
  async login(
    @Body() body: { email: string; password: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const pub = await this.auth.validateUser(body.email, body.password);
    if (!pub) return { ok: false };
    return await this.auth.login(res, pub);
  }

  @Get('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    const cookieName = process.env.COOKIE_NAME || 'access_token';
    res.cookie(cookieName, '', { httpOnly: true, maxAge: 0, path: '/' });
    return { ok: true };
  }

  @Get('session')
  async session(@Req() req: Request) {
    const cookieName = process.env.COOKIE_NAME || 'access_token';
    const token = (req as any).cookies?.[cookieName];
    if (!token) return { authenticated: false };
    try {
      const payload = await this.jose.verify(token);
      return { authenticated: true, user: payload };
    } catch {
      return { authenticated: false };
    }
  }
}


