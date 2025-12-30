import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
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

type PublicUser = Omit<User, 'password'>;

type LoginResult = {
  token: string;
  user: PublicUser;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Supplier)
    private readonly suppliers: Repository<Supplier>,
    @InjectRepository(SupplierDocument)
    private readonly supplierDocs: Repository<SupplierDocument>,
    @InjectRepository(SupplierDocumentType)
    private readonly documentTypes: Repository<SupplierDocumentType>,
    private readonly jose: JoseService,
    private readonly kycDocs: KycDocsService,
    private readonly geocoding: GoogleGeocodingService,
  ) {}

  async register(
    dto: UserRegisterDto | SupplierRegisterDto,
    docs?: Record<string, UploadedFile | undefined>,
  ): Promise<PublicUser> {
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
      status:
        (dto.role ?? 'user') === 'supplier'
          ? UserStatus.INACTIVE
          : UserStatus.ACTIVE,
    });
    await this.users.save(user);

    if (user.role === 'supplier') {
      this.ensureSupplierDocuments(docs);
      const uploadedDocs = await this.kycDocs.uploadSupplierDocs(user.id, docs);

      const supplier = this.suppliers.create({
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
      await this.suppliers.save(supplier);
      await this.saveUploadedDocuments(supplier, uploadedDocs);
    }
    return user.toPublic();
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

  private normalizeOptionalName(value?: string | null) {
    const normalized = (value ?? '').trim();
    return normalized.length ? normalized : null;
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
}
