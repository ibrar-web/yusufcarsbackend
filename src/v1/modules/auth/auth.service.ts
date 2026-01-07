import {
  Injectable,
  BadRequestException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { User, UserStatus } from '../../entities/user.entity';
import { Supplier } from '../../entities/supplier.entity';
import { SupplierDocument } from '../../entities/supplier-document.entity';
import { SupplierDocumentType } from '../../entities/supplier-document-type.entity';
import { JoseService } from './jose.service';
import { UserRegisterDto } from './authdtos/userregister.dto';
import { SupplierRegisterDto } from './authdtos/supplierregister.dto';
import { type UploadedFile } from '../../common/aws/s3.service';
import {
  KycDocsService,
  type UploadedDocMeta,
} from '../../common/aws/kyc-docs.service';
import { GoogleGeocodingService } from '../../common/geocoding/google-geocoding.service';
import { EmailVerification } from '../../entities/email-verification.entity';
import { sendEmailVerificationEmail } from '../../common/emails/templates';
import { GoogleLoginDto } from './authdtos/google-login.dto';
import { JWTPayload, createRemoteJWKSet, jwtVerify } from 'jose';
import { applyProfileCompletion } from '../../common/utils/profile-completion.util';

const GOOGLE_JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/oauth2/v3/certs'),
);
const GOOGLE_ISSUERS: string[] = [
  'https://accounts.google.com',
  'accounts.google.com',
];

type GoogleIdPayload = JWTPayload & {
  email?: string;
  email_verified?: boolean;
  given_name?: string;
  family_name?: string;
  name?: string;
  picture?: string;
};

type PublicUser = Omit<User, 'password'>;

type LoginResult = {
  token: string;
  user: PublicUser;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly verificationTtlMinutes = 30;

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Supplier)
    private readonly suppliers: Repository<Supplier>,
    @InjectRepository(SupplierDocument)
    private readonly supplierDocs: Repository<SupplierDocument>,
    @InjectRepository(SupplierDocumentType)
    private readonly documentTypes: Repository<SupplierDocumentType>,
    @InjectRepository(EmailVerification)
    private readonly emailVerifications: Repository<EmailVerification>,
    private readonly jose: JoseService,
    private readonly kycDocs: KycDocsService,
    private readonly geocoding: GoogleGeocodingService,
  ) {}

  async register(
    dto: UserRegisterDto | SupplierRegisterDto,
    docs?: Record<string, UploadedFile | undefined>,
  ): Promise<{ user: PublicUser; message: string }> {
    const existing = await this.users.findOne({ where: { email: dto.email } });
    if (existing) throw new BadRequestException('Email already in use');

    const supplierDto = dto as SupplierRegisterDto;
    const postCode = this.resolvePostCode(dto);
    if (!postCode) throw new BadRequestException('Postcode is required');
    const coordinates = await this.lookupCoordinates(postCode);

    const user = this.users.create({
      email: dto.email,
      password: dto.password,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: dto.role ?? 'user',
      postCode,
      latitude: coordinates?.latitude,
      longitude: coordinates?.longitude,
      status: UserStatus.INACTIVE,
      emailVerifiedAt: null,
    });
    const verificationCode = this.generateCode();
    const verificationExpiresAt = new Date(
      Date.now() + this.verificationTtlMinutes * 60_000,
    );
    const verificationToken = await this.jose.sign(
      { email: dto.email, code: verificationCode },
      { expiresIn: `${this.verificationTtlMinutes}m` },
    );
    const verificationUrl = this.buildVerificationUrl(verificationToken);
    try {
      await sendEmailVerificationEmail({
        to: dto.email,
        name: this.normalizeRequiredName(dto.firstName),
        verificationUrl,
        expiresInMinutes: this.verificationTtlMinutes,
      });
    } catch (error) {
      this.logger.warn(
        `Verification email failed for ${dto.email}: ${
          error instanceof Error ? error.message : error
        }`,
      );
      throw new BadRequestException(
        'Unable to send verification email. Please check the email address and try again.',
      );
    }

    await this.users.save(user);

    let supplier: Supplier | undefined;
    if (user.role === 'supplier') {
      this.ensureSupplierDocuments(docs);
      const uploadedDocs = await this.kycDocs.uploadSupplierDocs(user.id, docs);

      supplier = this.suppliers.create({
        user,
        businessName: supplierDto.businessName,
        tradingAs: supplierDto.tradingAs,
        businessType: supplierDto.businessType,
        vatNumber: supplierDto.vatNumber,
        description: supplierDto.description,
        addressLine1: supplierDto.addressLine1,
        addressLine2: supplierDto.addressLine2,
        city: supplierDto.city,
        postCode: supplierDto.postCode,
        phone: supplierDto.phone,
        termsAccepted: supplierDto.termsAccepted,
        gdprConsent: supplierDto.gdprConsent,
        submittedAt: new Date(),
      });
      supplier = await this.suppliers.save(supplier);
      await this.saveUploadedDocuments(supplier, uploadedDocs);
    }
    applyProfileCompletion(user, supplier ?? null);
    await this.createVerificationRecord(
      user,
      verificationCode,
      verificationExpiresAt,
    );
    await this.users.save(user);
    const message =
      'Verification email sent. Please check your inbox to verify your account.';
    return { user: user.toPublic(), message };
  }

  private resolvePostCode(dto: UserRegisterDto | SupplierRegisterDto) {
    const supplierDto = dto as SupplierRegisterDto;
    return (dto.postCode || supplierDto.postCode || '').trim();
  }

  private async lookupCoordinates(postCode: string) {
    const invalidMessage = 'Invalid postcode provided';
    try {
      const coordinates = await this.geocoding.lookupPostcode(postCode);
      if (!coordinates) {
        throw new BadRequestException(invalidMessage);
      }
      return coordinates;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(
        `Failed to lookup coordinates for ${postCode}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException(invalidMessage);
    }
  }

  private normalizeRequiredName(value?: string | null, fallback = 'User') {
    const normalized = (value ?? '').trim();
    return normalized.length ? normalized : fallback;
  }

  private ensureSupplierDocuments(
    docs?: Record<string, UploadedFile | undefined>,
  ) {
    // const required = ['company_registration', 'insurance_certificate'];
    const required = ['company_registration'];
    const missing = required.filter((key) => !docs?.[key]);
    if (missing.length) {
      throw new BadRequestException(
        `Missing mandatory supplier documents: ${missing.join(', ')}`,
      );
    }
  }

  private async saveUploadedDocuments(
    supplier: Supplier,
    uploadedDocs: Record<string, UploadedDocMeta>,
  ) {
    const entries = Object.entries(uploadedDocs || {});
    if (!entries.length) return;
    const names = entries.map(([name]) => name);
    const types = await this.documentTypes.find({
      where: { name: In(names) },
    });
    const typeMap = new Map(types.map((type) => [type.name, type]));
    const missingNames = names.filter((name) => !typeMap.has(name));
    if (missingNames.length) {
      const newTypes = missingNames.map((name) =>
        this.documentTypes.create({
          name,
          displayName: this.humanizeDocumentType(name),
        }),
      );
      const saved = await this.documentTypes.save(newTypes);
      for (const savedType of saved) {
        typeMap.set(savedType.name, savedType);
      }
    }
    const documents: SupplierDocument[] = [];
    for (const [name, meta] of entries) {
      const documentType = typeMap.get(name);
      if (!documentType) {
        throw new BadRequestException(
          `Document type "${name}" is not configured`,
        );
      }
      documents.push(
        this.supplierDocs.create({
          supplier,
          documentType,
          s3Key: meta.key,
          originalName: meta.originalName,
          mimeType: meta.mimeType,
          size: meta.size,
        }),
      );
    }
    if (documents.length > 0) {
      await this.supplierDocs.save(documents);
    }
  }

  private humanizeDocumentType(name: string) {
    return name
      .replace(/[-_]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<PublicUser | null> {
    const user = await this.users.findOne({ where: { email } });
    if (!user) return null;
    if (!user.emailVerifiedAt) return null;
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return null;
    if (user.status !== UserStatus.ACTIVE) return null;
    return user.toPublic();
  }

  async login(userPublic: PublicUser): Promise<LoginResult> {
    const token = await this.jose.sign({
      sub: userPublic.id,
      email: userPublic.email,
      role: userPublic.role,
    });
    return { token, user: userPublic };
  }
  logout() {
    return { ok: true };
  }

  async verifyEmail(email: string, code: string): Promise<{ verified: true }> {
    const user = await this.users.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException('Account not found');
    }
    if (user.emailVerifiedAt) {
      return { verified: true };
    }
    const verification = await this.emailVerifications.findOne({
      where: { user: { id: user.id }, consumed: false },
      order: { createdAt: 'DESC' },
    });
    if (!verification) {
      throw new BadRequestException('Verification code not found');
    }
    if (verification.expiresAt < new Date()) {
      throw new BadRequestException('Verification code expired');
    }
    if (verification.code !== code) {
      verification.attempts += 1;
      await this.emailVerifications.save(verification);
      throw new BadRequestException('Invalid verification code');
    }
    verification.consumed = true;
    verification.verifiedAt = new Date();
    await this.emailVerifications.save(verification);

    user.emailVerifiedAt = new Date();
    if (user.role !== 'supplier') {
      user.status = UserStatus.ACTIVE;
    }
    await this.users.save(user);
    return { verified: true };
  }

  async verifyEmailWithToken(token: string): Promise<{ verified: true }> {
    let payload: { email?: string; code?: string };
    try {
      payload = await this.jose.verify<{ email?: string; code?: string }>(
        token,
      );
    } catch (error) {
      this.logger.warn(
        `Invalid verification token: ${
          error instanceof Error ? error.message : error
        }`,
      );
      throw new BadRequestException(
        'Verification link is invalid or has expired.',
      );
    }
    if (!payload.email || !payload.code) {
      throw new BadRequestException(
        'Verification link is invalid or has expired.',
      );
    }
    return this.verifyEmail(payload.email, payload.code);
  }

  async loginWithGoogle(dto: GoogleLoginDto): Promise<LoginResult> {
    const payload = await this.verifyGoogleIdToken(dto.idToken);
    const email = (payload.email || '').toLowerCase();
    if (!email) {
      throw new BadRequestException('Google account missing email');
    }
    if (!payload.email_verified) {
      throw new BadRequestException(
        'Google account email is not verified. Please verify with Google first.',
      );
    }

    let user = await this.users.findOne({
      where: { email },
      relations: { supplier: true },
    });
    let supplier: Supplier | null = user?.supplier ?? null;
    if (!user) {
      const postCode = (dto.postCode ?? '').trim();
      if (!postCode) {
        throw new BadRequestException(
          'Postcode is required to complete signup',
        );
      }
      const coordinates = await this.lookupCoordinates(postCode);
      user = this.users.create({
        email,
        password: this.generateRandomPassword(),
        firstName: this.normalizeRequiredName(payload.given_name),
        lastName: this.normalizeRequiredName(payload.family_name, 'User'),
        role: 'user',
        postCode,
        latitude: coordinates?.latitude,
        longitude: coordinates?.longitude,
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date(),
      });
      await this.users.save(user);
    } else if (!user.emailVerifiedAt) {
      user.emailVerifiedAt = new Date();
      if (user.role !== 'supplier') {
        user.status = UserStatus.ACTIVE;
      }
      await this.users.save(user);
    }

    if (
      user.status === UserStatus.SUSPENDED ||
      user.status === UserStatus.DELETED
    ) {
      throw new BadRequestException('Account is not active');
    }

    if (!supplier && user.role === 'supplier') {
      supplier = await this.suppliers.findOne({
        where: { user: { id: user.id } },
      });
    }
    applyProfileCompletion(user, supplier ?? null);
    await this.users.save(user);

    return this.login(user.toPublic());
  }

  private async createVerificationRecord(
    user: User,
    code: string,
    expiresAt: Date,
  ) {
    const verification = this.emailVerifications.create({
      user,
      code,
      expiresAt,
      consumed: false,
      attempts: 0,
    });
    await this.emailVerifications.save(verification);
  }

  private generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private buildVerificationUrl(token: string) {
    const base =
      process.env.EMAIL_VERIFICATION_URL ??
      process.env.FRONTEND_URL ??
      process.env.CORS_ORIGIN ??
      '';
    if (!base) return '#';
    try {
      const url = new URL(base);
      url.searchParams.set('token', token);
      return url.toString();
    } catch {
      return '#';
    }
  }

  private async verifyGoogleIdToken(idToken: string): Promise<GoogleIdPayload> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new BadRequestException('Google authentication is not configured.');
    }
    try {
      const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
        audience: clientId,
        issuer: GOOGLE_ISSUERS,
      });
      return payload as GoogleIdPayload;
    } catch (error) {
      this.logger.warn(
        `Google token verification failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
      throw new BadRequestException('Invalid Google ID token');
    }
  }

  private generateRandomPassword() {
    return randomUUID().replace(/-/g, '');
  }
}
