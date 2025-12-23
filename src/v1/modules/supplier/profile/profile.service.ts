import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  Supplier,
  SupplierApprovalStatus,
} from '../../../entities/supplier.entity';
import { User } from '../../../entities/user.entity';
import {
  UpdateSupplierFlatDto,
  UpdateSupplierPasswordDto,
} from './profile.dto';
import * as bcrypt from 'bcrypt';
import { SupplierDocument } from '../../../entities/supplier-document.entity';
import { SupplierDocumentType } from '../../../entities/supplier-document-type.entity';
import { KycDocsService } from '../../../common/aws/kyc-docs.service';
import type { UploadedFile } from '../../../common/aws/s3.service';
import { S3Service } from '../../../common/aws/s3.service';
import { GoogleGeocodingService } from '../../../common/geocoding/google-geocoding.service';
import { Logger } from '@nestjs/common';

type SupplierDocumentInfo = {
  id: string;
  documentTypeId: string;
  type?: string;
  displayName?: string;
  s3Key: string;
  originalName: string;
  mimeType?: string;
  size?: number;
  createdAt: Date;
  signedUrl: string;
};

type SupplierDocumentsResponse = {
  byType: Record<string, SupplierDocumentInfo>;
  latestDocuments: SupplierDocumentInfo[];
};

type SupplierProfileResponse = User & {
  supplier?: (Supplier & { documentFiles?: SupplierDocumentsResponse }) | null;
};

@Injectable()
export class SupplierProfileService {
  private readonly logger = new Logger(SupplierProfileService.name);

  constructor(
    @InjectRepository(Supplier)
    private readonly suppliers: Repository<Supplier>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(SupplierDocument)
    private readonly documents: Repository<SupplierDocument>,
    @InjectRepository(SupplierDocumentType)
    private readonly documentTypes: Repository<SupplierDocumentType>,
    private readonly kycDocs: KycDocsService,
    private readonly s3: S3Service,
    private readonly geocoding: GoogleGeocodingService,
  ) {}

  async getProfile(userId: string): Promise<SupplierProfileResponse> {
    const supplierUser = await this.users.findOne({
      where: { id: userId },
      relations: ['supplier'],
    });
    if (!supplierUser) throw new NotFoundException('Supplier not found');
    if (supplierUser.supplier) {
      const documentFiles = await this.buildDocumentResponse(
        supplierUser.supplier.id,
      );
      (
        supplierUser.supplier as Supplier & {
          documentFiles: SupplierDocumentsResponse;
        }
      ).documentFiles = documentFiles;
    }
    return supplierUser;
  }

  async updateProfile(
    userId: string,
    dto: UpdateSupplierFlatDto,
    docs?: Record<string, UploadedFile | undefined>,
  ): Promise<Supplier & { documentFiles: SupplierDocumentsResponse }> {
    const supplierUser = await this.getProfile(userId);

    if (!supplierUser.supplier) {
      throw new NotFoundException('Supplier profile not found');
    }

    // 🔹 USER fields (MUST be keys of User)
    const userFields = ['email', 'firstName', 'lastName', 'postCode'] as const;
    type UserField = (typeof userFields)[number];

    // 🔹 SUPPLIER fields (MUST be keys of Supplier)
    const supplierFields = [
      'businessName',
      'tradingAs',
      'businessType',
      'description',
      'addressLine1',
      'addressLine2',
      'city',
      'postCode',
      'phone',
    ] as const;
    type SupplierField = (typeof supplierFields)[number];
    const supplierFieldDtoMap: Record<
      SupplierField,
      keyof UpdateSupplierFlatDto
    > = {
      businessName: 'businessName',
      tradingAs: 'tradingAs',
      businessType: 'businessType',
      description: 'description',
      addressLine1: 'addressLine1',
      addressLine2: 'addressLine2',
      city: 'city',
      postCode: 'postCode',
      phone: 'phone',
    };

    const userUpdate: Partial<Pick<User, UserField>> = {};
    const supplierUpdate: Partial<Pick<Supplier, SupplierField>> = {};

    for (const key of userFields) {
      const value = dto[key];
      if (value !== undefined && value !== null) {
        userUpdate[key] = value;
      }
    }

    for (const key of supplierFields) {
      const dtoKey = supplierFieldDtoMap[key];
      const value = dto[dtoKey];
      if (value !== undefined && value !== null) {
        supplierUpdate[key] = value as Supplier[typeof key];
      }
    }

    const needsPostcodeUpdate = dto.postCode?.trim();

    if (Object.keys(userUpdate).length) {
      Object.assign(supplierUser, userUpdate);
      if (needsPostcodeUpdate) {
        await this.updateCoordinates(
          supplierUser,
          supplierUser.postCode?.trim() || '',
        );
      }
      await this.users.save(supplierUser);
    }

    if (Object.keys(supplierUpdate).length) {
      Object.assign(supplierUser.supplier, supplierUpdate);
    }

    await this.applyDocumentUpdates(
      supplierUser as User & { supplier: Supplier },
      docs,
    );

    if (Object.keys(supplierUpdate).length) {
      await this.suppliers.save(supplierUser.supplier);
    }

    const documentFiles = await this.buildDocumentResponse(
      supplierUser.supplier.id,
    );
    (
      supplierUser.supplier as Supplier & {
        documentFiles: SupplierDocumentsResponse;
      }
    ).documentFiles = documentFiles;

    return supplierUser.supplier as Supplier & {
      documentFiles: SupplierDocumentsResponse;
    };
  }

  async updatePassword(
    userId: string,
    dto: UpdateSupplierPasswordDto,
  ): Promise<Omit<User, 'password'>> {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    const matches = await bcrypt.compare(dto.currentPassword, user.password);
    if (!matches) {
      throw new BadRequestException('Current password is incorrect');
    }
    user.password = dto.newPassword;
    const saved = await this.users.save(user);
    return saved.toPublic();
  }

  private async buildDocumentResponse(
    supplierId: string,
  ): Promise<SupplierDocumentsResponse> {
    const docs = await this.documents.find({
      where: { supplier: { id: supplierId } },
      relations: { documentType: true },
      order: { createdAt: 'DESC' },
    });

    const withSignedUrl = await Promise.all(
      docs.map(async (doc) => ({
        id: doc.id,
        documentTypeId: doc.documentTypeId,
        type: doc.documentType?.name,
        displayName: doc.documentType?.displayName,
        s3Key: doc.s3Key,
        originalName: doc.originalName,
        mimeType: doc.mimeType,
        size: doc.size,
        createdAt: doc.createdAt,
        signedUrl: await this.kycDocs.getSignedUrl(doc.s3Key),
      })),
    );

    const byType = withSignedUrl.reduce<Record<string, SupplierDocumentInfo>>(
      (acc, doc) => {
        if (doc.type && !acc[doc.type]) {
          acc[doc.type] = doc;
        }
        return acc;
      },
      {},
    );

    const latestDocuments = Object.values(byType);
    return { byType, latestDocuments };
  }

  private async applyDocumentUpdates(
    profile: User & { supplier: Supplier },
    docs?: Record<string, UploadedFile | undefined>,
  ): Promise<void> {
    if (!docs || !Object.keys(docs).length) return;

    const filteredDocs: Record<string, UploadedFile> = {};
    for (const [name, file] of Object.entries(docs)) {
      if (file) filteredDocs[name] = file;
    }
    if (!Object.keys(filteredDocs).length) return;

    const uploaded = await this.kycDocs.uploadSupplierDocs(
      profile.id,
      filteredDocs,
    );
    if (!Object.keys(uploaded).length) return;

    const docNames = Object.keys(uploaded);
    const typeMap = await this.ensureDocumentTypes(docNames);

    const existingDocs = await this.documents.find({
      where: {
        supplier: { id: profile.supplier.id },
        documentType: { name: In(docNames) },
      },
      relations: { documentType: true },
    });

    if (existingDocs.length) {
      await Promise.all(existingDocs.map((doc) => this.s3.delete(doc.s3Key)));
      await this.documents.remove(existingDocs);
    }

    const newDocs: SupplierDocument[] = [];
    for (const name of docNames) {
      const type = typeMap.get(name);
      const meta = uploaded[name];
      if (!type || !meta) continue;
      newDocs.push(
        this.documents.create({
          supplier: profile.supplier,
          documentType: type,
          s3Key: meta.key,
          originalName: meta.originalName,
          mimeType: meta.mimeType,
          size: meta.size,
        }),
      );
    }

    if (newDocs.length) {
      await this.documents.save(newDocs);
      profile.supplier.approvalStatus = SupplierApprovalStatus.PENDING;
      profile.supplier.rejectionReason = null;
      profile.supplier.approvedAt = null;
    }
  }

  private async updateCoordinates(user: User, postCode: string) {
    const normalized = postCode.trim();
    if (!normalized) return;
    try {
      const coordinates = await this.geocoding.lookupPostcode(normalized);
      if (coordinates) {
        user.latitude = coordinates.latitude;
        user.longitude = coordinates.longitude;
        user.postCode = normalized;
      }
    } catch (error) {
      this.logger.error(
        `Failed to lookup coordinates for ${normalized}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  private async ensureDocumentTypes(
    names: string[],
  ): Promise<Map<string, SupplierDocumentType>> {
    if (!names.length) return new Map<string, SupplierDocumentType>();

    const existing = await this.documentTypes.find({
      where: { name: In(names) },
    });
    const map = new Map(existing.map((type) => [type.name, type]));

    const missing = names.filter((name) => !map.has(name));
    if (missing.length) {
      const newTypes = this.documentTypes.create(
        missing.map((name) => ({
          name,
          displayName: this.humanizeDocumentType(name),
        })),
      );
      const saved = await this.documentTypes.save(newTypes);
      for (const type of saved) {
        map.set(type.name, type);
      }
    }

    return map;
  }

  private humanizeDocumentType(name: string) {
    return name
      .replace(/[-_]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }
}
