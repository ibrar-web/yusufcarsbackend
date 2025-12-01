import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';
import { User } from '../../entities/user.entity';
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
  ) {
    const existing = await this.users.findOne({ where: { email: dto.email } });
    if (existing) throw new BadRequestException('Email already in use');

    const supplierDto = dto as SupplierRegisterDto;
    const postCode = this.resolvePostCode(dto);
    if (!postCode) throw new BadRequestException('Postcode is required');
    const coordinates = await this.lookupCoordinates(postCode);
    const fullName =
      dto.fullName ||
      supplierDto.firstName ||
      supplierDto.businessName ||
      'Supplier User';
    const user = this.users.create({
      email: dto.email,
      password: dto.password,
      fullName,
      role: dto.role ?? 'user',
      postCode,
      latitude: coordinates?.latitude,
      longitude: coordinates?.longitude,
    });
    await this.users.save(user);

    if (user.role === 'supplier') {
      const uploadedDocs = await this.kycDocs.uploadSupplierDocs(user.id, docs);
      const businessName =
        supplierDto.businessName ||
        supplierDto.tradingAs ||
        supplierDto.fullName ||
        'Supplier';
      const supplier = this.suppliers.create({
        user,
        businessName,
        tradingAs: supplierDto.tradingAs,
        businessType: supplierDto.businessType,
        vatNumber: supplierDto.vatNumber,
        description: supplierDto.description,
        addressLine1: supplierDto.addressLine1,
        addressLine2: supplierDto.addressLine2,
        city: supplierDto.city,
        postCode: supplierDto.postCode || supplierDto.contactPostcode,
        phone: supplierDto.phone,
        contactPostcode: supplierDto.contactPostcode,
        serviceRadius: supplierDto.serviceRadius,
        termsAccepted: supplierDto.termsAccepted,
        gdprConsent: supplierDto.gdprConsent,
        categories: supplierDto.categories,
        submittedAt: new Date(),
      });
      await this.suppliers.save(supplier);
      await this.saveUploadedDocuments(supplier, uploadedDocs);
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return user.toPublic();
  }

  private resolvePostCode(dto: UserRegisterDto | SupplierRegisterDto) {
    const supplierDto = dto as SupplierRegisterDto;
    return (
      dto.postCode ||
      supplierDto.postCode ||
      supplierDto.contactPostcode ||
      ''
    ).trim();
  }

  private async lookupCoordinates(postCode: string) {
    try {
      return await this.geocoding.lookupPostcode(postCode);
    } catch (error) {
      this.logger.error(
        `Failed to lookup coordinates for ${postCode}`,
        error instanceof Error ? error.stack : undefined,
      );
      return null;
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

  async validateUser(email: string, password: string) {
    const user = await this.users.findOne({ where: { email } });
    if (!user) return null;
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return null;
    return user.toPublic();
  }

  async login(res: Response, userPublic: any) {
    const token = await this.jose.sign({
      sub: userPublic.id,
      email: userPublic.email,
      role: userPublic.role,
    });
    const cookieName = process.env.COOKIE_NAME || 'access_token';
    const domain = process.env.COOKIE_DOMAIN || undefined;
    const secure = process.env.NODE_ENV === 'production';
    const maxAge = (() => {
      const s = process.env.TOKEN_EXPIRES_IN || '1d';
      const m = /^([0-9]+)([smhd])$/.exec(s) || [];
      const n = parseInt(m[1] || '1', 10);
      const mult =
        m[2] === 's' ? 1 : m[2] === 'm' ? 60 : m[2] === 'h' ? 3600 : 86400;
      return n * mult * 1000;
    })();

    res.cookie(cookieName, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure,
      domain,
      maxAge,
      path: '/',
    });
    return userPublic;
  }
}
