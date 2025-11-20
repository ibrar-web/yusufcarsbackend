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
    docs?: Record<string, UploadedFile | undefined>,
  ): Promise<Record<string, UploadedDocMeta>> {
    if (!docs) return {};
    const entries = await Promise.all(
      Object.entries(docs).map(async ([key, file]) => {
        if (!file) return null;
        const uploaded = await this.s3.uploadKycDocument(
          `supplier/${userId}`,
          file,
          key,
        );
        return [
          key,
          {
            key: uploaded.key,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
          } satisfies UploadedDocMeta,
        ] as const;
      }),
    );
    const result: Record<string, UploadedDocMeta> = {};
    for (const entry of entries) {
      if (!entry) continue;
      const [docKey, meta] = entry;
      result[docKey] = meta;
    }
    return result;
  }

  async getSignedUrl(key: string, expiresIn = 300) {
    return this.s3.getSignedUrl(key, expiresIn);
  }
}
