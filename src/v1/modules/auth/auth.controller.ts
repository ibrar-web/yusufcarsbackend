import {
  Body,
  Controller,
  Get,
  Post,
  Res,
  Req,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import type { Response, Request } from 'express';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { AuthService } from './auth.service';
import { JoseService } from './jose.service';
import { UserRegisterDto } from './authdtos/userregister.dto';
import { SupplierRegisterDto } from './authdtos/supplierregister.dto';
import type { UploadedFile } from '../../common/aws/s3.service';

@Controller('/auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly jose: JoseService,
  ) {}

  @Post('register')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'companyRegDoc', maxCount: 1 },
      { name: 'insuranceDoc', maxCount: 1 },
    ]),
  )
  async register(
    @Body() body: UserRegisterDto | SupplierRegisterDto,
    @UploadedFiles()
    files?: {
      companyRegDoc?: UploadedFile[];
      insuranceDoc?: UploadedFile[];
    },
  ) {
    const role = body.role || 'user';
    const dto =
      role === 'supplier'
        ? plainToInstance(SupplierRegisterDto, body)
        : plainToInstance(UserRegisterDto, body);

    await validateOrReject(dto);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return await this.auth.register(dto, {
      companyRegDoc: files?.companyRegDoc?.[0],
      insuranceDoc: files?.insuranceDoc?.[0],
    });
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
