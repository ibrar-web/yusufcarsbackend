/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Body,
  Controller,
  Get,
  Post,
  Res,
  Req,
  UploadedFiles,
  UseInterceptors,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import type { Response, Request } from 'express';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { AuthService } from './auth.service';
import { JoseService } from './jose.service';
import { AdminRegisterDto, UserRegisterDto } from './authdtos/userregister.dto';
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

    try {
      await validateOrReject(dto);
    } catch (error) {
      throw new BadRequestException(this.formatValidationErrors(error));
    }

    const docUploads: Record<string, UploadedFile | undefined> = {};
    if (files?.companyRegDoc?.[0]) {
      docUploads['company_registration'] = files.companyRegDoc[0];
    }
    if (files?.insuranceDoc?.[0]) {
      docUploads['insurance_certificate'] = files.insuranceDoc[0];
    }
    const docsPayload =
      Object.keys(docUploads).length > 0 ? docUploads : undefined;

    return await this.auth.register(dto, docsPayload);
  }

  @Post('login')
  async login(
    @Body() body: { email: string; password: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    console.log('body:', body);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const pub = await this.auth.validateUser(body.email, body.password);
    if (!pub) {
      // Standardized error for invalid credentials
      throw new UnauthorizedException('Invalid email or password');
    }
    return await this.auth.login(res, pub);
  }

  @Get('logout')
  logout(@Res({ passthrough: true }) res: Response) {
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
  @Post('register/admin')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'companyRegDoc', maxCount: 1 },
      { name: 'insuranceDoc', maxCount: 1 },
    ]),
  )
  async registerAdmin(@Body() body: AdminRegisterDto) {
    return await this.auth.register(body);
  }

  private formatValidationErrors(error: unknown) {
    if (!Array.isArray(error)) return 'Invalid request payload';
    const messages: string[] = [];
    for (const err of error) {
      const constraints = err?.constraints;
      if (constraints && typeof constraints === 'object') {
        for (const value of Object.values(constraints)) {
          if (typeof value === 'string') {
            messages.push(value);
          }
        }
      }
    }
    return messages.length ? messages.join(', ') : 'Invalid request payload';
  }

  
}
