import { Injectable } from '@nestjs/common';
import { S3Service, type UploadedFile } from './s3.service';

@Injectable()
export class KycDocsService {
  constructor(private readonly s3: S3Service) {}

  async uploadSupplierDocs(
    userId: string,
    docs?: { companyRegDoc?: UploadedFile; insuranceDoc?: UploadedFile },
  ) {
    const [companyRegDocUrl, insuranceDocUrl] = await Promise.all([
      docs?.companyRegDoc
        ? this.s3.uploadKycDocument(userId, docs.companyRegDoc, 'company-reg').then((r) => r.url)
        : Promise.resolve(undefined),
      docs?.insuranceDoc
        ? this.s3.uploadKycDocument(userId, docs.insuranceDoc, 'insurance').then((r) => r.url)
        : Promise.resolve(undefined),
    ]);

    return { companyRegDocUrl, insuranceDocUrl };
  }
}
