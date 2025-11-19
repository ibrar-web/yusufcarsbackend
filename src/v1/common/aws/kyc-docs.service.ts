import { Injectable } from '@nestjs/common';
import { S3Service, type UploadedFile } from './s3.service';

export type UploadedDocMeta = {
  key: string;
  originalName: string;
  mimeType: string;
  size?: number;
};

@Injectable()
export class KycDocsService {
  constructor(private readonly s3: S3Service) {}

  async uploadSupplierDocs(
    userId: string,
    docs?: { companyRegDoc?: UploadedFile; insuranceDoc?: UploadedFile },
  ): Promise<{
    companyRegDoc?: UploadedDocMeta;
    insuranceDoc?: UploadedDocMeta;
  }> {
    const [companyRegDoc, insuranceDoc] = await Promise.all([
      docs?.companyRegDoc
        ? this.s3
            .uploadKycDocument(userId, docs.companyRegDoc, 'company-reg')
            .then((res) => ({
              key: res.key,
              originalName: docs.companyRegDoc!.originalname,
              mimeType: docs.companyRegDoc!.mimetype,
              size: docs.companyRegDoc!.size,
            }))
        : Promise.resolve(undefined),
      docs?.insuranceDoc
        ? this.s3
            .uploadKycDocument(userId, docs.insuranceDoc, 'insurance')
            .then((res) => ({
              key: res.key,
              originalName: docs.insuranceDoc!.originalname,
              mimeType: docs.insuranceDoc!.mimetype,
              size: docs.insuranceDoc!.size,
            }))
        : Promise.resolve(undefined),
    ]);

    return { companyRegDoc, insuranceDoc };
  }

  async getSignedUrl(key: string, expiresIn = 300) {
    return this.s3.getSignedUrl(key, expiresIn);
  }
}
