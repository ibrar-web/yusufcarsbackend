import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import {
  Supplier,
  SupplierApprovalStatus,
} from '../../../entities/supplier.entity';

import { User } from 'src/v1/entities/user.entity';
import { SupplierDocument } from '../../../entities/supplier-document.entity';
import { KycDocsService } from '../../../common/aws/kyc-docs.service';

type ListSuppliersParams = {
  page?: number;
  limit?: number;
  approvalStatus?: SupplierApprovalStatus;
  isActive?: boolean;
  query?: string;
};

@Injectable()
export class AdminSuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private readonly suppliers: Repository<Supplier>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(SupplierDocument)
    private readonly documents: Repository<SupplierDocument>,
    private readonly kycDocs: KycDocsService,
  ) {}

  async list(params: ListSuppliersParams) {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit =
      params.limit && params.limit > 0 ? Math.min(params.limit, 100) : 20;
    const skip = (page - 1) * limit;

    const qb = this.suppliers
      .createQueryBuilder('supplier')
      .leftJoinAndSelect('supplier.user', 'user')
      .where('user.role = :role', { role: 'supplier' })
      .skip(skip)
      .take(limit)
      .orderBy('supplier.createdAt', 'DESC');

    if (params.isActive !== undefined) {
      qb.andWhere('user.isActive = :isActive', { isActive: params.isActive });
    }

    if (params.approvalStatus) {
      qb.andWhere('supplier.approvalStatus = :status', {
        status: params.approvalStatus,
      });
    }

    if (params.query) {
      qb.andWhere(
        new Brackets((expr) => {
          const q = `%${params.query}%`;
          expr
            .where('user.email ILIKE :q', { q })
            .orWhere('user.fullName ILIKE :q', { q })
            .orWhere('supplier.businessName ILIKE :q', { q })
            .orWhere('supplier.tradingAs ILIKE :q', { q });
        }),
      );
    }

    const [data, total] = await qb.getManyAndCount();

    return { data, meta: { total, page, limit } };
  }

  async findOne(id: string) {
    const supplier = await this.findSupplierEntity(id);
    const documentFiles = await this.buildDocumentResponse(supplier.id);
    return { ...supplier, documentFiles };
  }

  async approve(id: string) {
    return this.updateSupplierStatus(
      id,
      {
        approvalStatus: SupplierApprovalStatus.APPROVED,
        rejectionReason: null,
        approvedAt: new Date(),
      },
      {
        isActive: true,
        suspensionReason: null,
      },
    );
  }

  async reject(id: string, reason: string) {
    return this.updateSupplierStatus(
      id,
      {
        approvalStatus: SupplierApprovalStatus.REJECTED,
        rejectionReason: reason,
        approvedAt: null,
      },
      {
        isActive: false,
        suspensionReason: reason,
      },
    );
  }

  async enable(id: string) {
    return this.updateSupplierStatus(
      id,
      {},
      {
        isActive: true,
        suspensionReason: null,
      },
    );
  }

  async disable(id: string, reason: string) {
    return this.updateSupplierStatus(
      id,
      {},
      {
        isActive: false,
        suspensionReason: reason,
      },
    );
  }

  async getDocuments(id: string) {
    const supplier = await this.findSupplierEntity(id);
    return this.buildDocumentResponse(supplier.id);
  }

  private async findSupplierEntity(id: string) {
    const supplier = await this.suppliers.findOne({
      where: { user: { id } },
      relations: { user: true },
    });
    if (!supplier) throw new NotFoundException('Supplier not found');
    return supplier;
  }

  private async updateSupplierStatus(
    id: string,
    updates: Partial<Supplier>,
    userUpdates?: Partial<User>,
  ) {
    const supplier = await this.findSupplierEntity(id);
    Object.assign(supplier, updates);
    if (userUpdates) {
      Object.assign(supplier.user, userUpdates);
      await this.users.save(supplier.user);
    }
    return this.suppliers.save(supplier);
  }

  private async buildDocumentResponse(supplierId: string) {
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
    const byType = withSignedUrl.reduce<
      Record<string, (typeof withSignedUrl)[0]>
    >((acc, doc) => {
      if (doc.type && !acc[doc.type]) {
        acc[doc.type] = doc;
      }
      return acc;
    }, {});
    const latestDocuments = Object.values(byType);
    return { byType, latestDocuments };
  }
}
