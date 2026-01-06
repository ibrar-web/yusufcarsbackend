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
    if (!token) {
      return this.renderVerificationResult({
        title: 'Verification link invalid',
        message:
          'The verification link is missing some information. Please request a new email.',
        success: false,
      });
    }
    try {
      await this.auth.verifyEmailWithToken(token);
      return this.renderVerificationResult({
        title: 'Profile verified',
        message:
          'Thanks for confirming your email. You can continue to PartsQuote.',
        success: true,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to verify your email right now.';
      return this.renderVerificationResult({
        title: 'Verification failed',
        message,
        success: false,
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

  private renderVerificationResult(options: {
    title: string;
    message: string;
    success: boolean;
  }): string {
    const continueUrl = process.env.CORS_ORIGIN || 'https://partsquote.co.uk';
    const accent = options.success ? '#16a34a' : '#dc2626';
    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${options.title}</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        background: #f5f5f4;
        margin: 0;
        padding: 24px;
        color: #1f2937;
      }
      .card {
        max-width: 480px;
        margin: 48px auto;
        background: #fff;
        border-radius: 16px;
        box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
        padding: 32px;
        text-align: center;
      }
      .card h1 {
        margin-top: 0;
        color: ${accent};
        font-size: 28px;
      }
      .card p {
        font-size: 16px;
        margin-bottom: 32px;
      }
      .card a {
        display: inline-block;
        padding: 12px 28px;
        background: #2563eb;
        color: #fff;
        border-radius: 999px;
        text-decoration: none;
        font-weight: 600;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>${options.title}</h1>
      <p>${options.message}</p>
      <a href="${continueUrl}" target="_self" rel="noopener">Continue</a>
    </div>
  </body>
</html>`;
  }
}
