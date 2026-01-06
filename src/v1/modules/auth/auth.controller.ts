/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UploadedFiles,
  UseInterceptors,
  UnauthorizedException,
  BadRequestException,
  Query,
  Header,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { AuthService } from './auth.service';
import { JoseService } from './jose.service';
import { AdminRegisterDto, UserRegisterDto } from './authdtos/userregister.dto';
import { SupplierRegisterDto } from './authdtos/supplierregister.dto';
import type { UploadedFile } from '../../common/aws/s3.service';
import type {
  AuthenticatedUser,
  RequestWithAuth,
} from '../../common/types/authenticated-user';
import type { ValidationError } from 'class-validator';
import { GoogleLoginDto } from './authdtos/google-login.dto';
import { renderVerificationResultPage } from '../../common/emails/templates';

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
  async login(@Body() body: { email: string; password: string }) {
    const pub = await this.auth.validateUser(body.email, body.password);
    if (!pub) {
      // Standardized error for invalid credentials
      throw new UnauthorizedException('Invalid email or password');
    }
    return await this.auth.login(pub);
  }

  @Post('logout')
  @Get('logout')
  logout() {
    return this.auth.logout();
  }

  @Get('session')
  async session(@Req() req: RequestWithAuth) {
    const authHeaderValue =
      typeof req.headers.authorization === 'string'
        ? req.headers.authorization
        : '';
    const token = authHeaderValue.startsWith('Bearer ')
      ? authHeaderValue.slice('Bearer '.length)
      : undefined;

    if (!token) return { authenticated: false };

    try {
      const payload = await this.jose.verify<AuthenticatedUser>(token);
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
    return await this.auth.register(body, undefined);
  }

  @Get('verify-email-link')
  @Header('Content-Type', 'text/html')
  async verifyEmailLink(@Query('token') token?: string): Promise<string> {
    const continueUrl = process.env.CORS_ORIGIN || 'https://partsquote.co.uk';
    if (!token) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      return renderVerificationResultPage({
        title: 'Verification link invalid',
        message:
          'The verification link is missing some information. Please request a new email.',
        success: false,
        continueUrl,
      });
    }
    try {
      await this.auth.verifyEmailWithToken(token);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      return renderVerificationResultPage({
        title: 'Profile verified',
        message:
          'Thanks for confirming your email. You can continue to PartsQuote.',
        success: true,
        continueUrl,
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to verify your email right now.';
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      return renderVerificationResultPage({
        title: 'Verification failed',
        message,
        success: false,
        continueUrl,
      });
    }
  }

  @Post('google')
  async googleAuth(@Body() dto: GoogleLoginDto) {
    return this.auth.loginWithGoogle(dto);
  }

  private formatValidationErrors(error: unknown): string {
    if (!Array.isArray(error)) return 'Invalid request payload';
    const validationErrors = (error as unknown[]).filter(
      (candidate): candidate is ValidationError =>
        this.isValidationError(candidate),
    );
    const messages = validationErrors
      .flatMap((err) => Object.values(err.constraints ?? {}))
      .filter((value): value is string => typeof value === 'string');
    return messages.length ? messages.join(', ') : 'Invalid request payload';
  }

  private isValidationError(value: unknown): value is ValidationError {
    return (
      typeof value === 'object' &&
      value !== null &&
      Array.isArray((value as ValidationError).children)
    );
  }
}
