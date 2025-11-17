import { Injectable } from '@nestjs/common';
import { S3Service, type UploadedFile } from './s3.service';
import { SupplierRegisterDto } from '../../modules/auth/authdtos/supplierregister.dto';

@Injectable()
export class KycDocsService {
  constructor(private readonly s3: S3Service) {}

  async uploadSupplierDocs(
    userId: string,
    docs?: { companyRegDoc?: UploadedFile; insuranceDoc?: UploadedFile },
    fallback?: SupplierRegisterDto,
  ) {
    const [companyRegDocUrl, insuranceDocUrl] = await Promise.all([
      docs?.companyRegDoc
        ? this.s3.uploadKycDocument(userId, docs.companyRegDoc, 'company-reg').then((r) => r.url)
        : Promise.resolve(fallback?.companyRegDoc),
      docs?.insuranceDoc
        ? this.s3.uploadKycDocument(userId, docs.insuranceDoc, 'insurance').then((r) => r.url)
        : Promise.resolve(fallback?.insuranceDoc),
    ]);

    return { companyRegDocUrl, insuranceDocUrl };
  }
}
