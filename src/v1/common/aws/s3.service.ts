import { Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { createHash, randomUUID } from 'crypto';
import { getSignedUrl as presign } from '@aws-sdk/s3-request-presigner';

export type UploadedFile = {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size?: number;
};

export type KycDocumentType = string;

@Injectable()
export class S3Service {
  private readonly client: S3Client;
  private readonly region: string;
  private readonly bucket: string | undefined;

  constructor() {
    this.region = process.env.AWS_REGION || 'eu-north-1';
    this.bucket = process.env.AWS_KYC_S3_BUCKET || process.env.AWS_S3_BUCKET;
    this.client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
  }

  async uploadKycDocument(
    userId: string,
    file: UploadedFile,
    docType: KycDocumentType,
  ): Promise<{ key: string; url: string }> {
    const key = this.generateKey(`${userId}/${docType}`, docType);
    const url = await this.upload(key, file);
    return { key, url };
  }

  async upload(key: string, file: UploadedFile): Promise<string> {
    if (!this.bucket) {
      throw new Error('AWS_KYC_S3_BUCKET (or AWS_S3_BUCKET) is not configured');
    }
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });
    await this.client.send(command);
    return this.buildPublicUrl(key);
  }

  async read(key: string) {
    if (!this.bucket) {
      throw new Error('AWS_KYC_S3_BUCKET (or AWS_S3_BUCKET) is not configured');
    }
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    return this.client.send(command);
  }

  async delete(key: string) {
    if (!this.bucket) {
      throw new Error('AWS_KYC_S3_BUCKET (or AWS_S3_BUCKET) is not configured');
    }
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    return this.client.send(command);
  }

  async getSignedUrl(key: string, expiresIn = 300) {
    if (!this.bucket) {
      throw new Error('AWS_KYC_S3_BUCKET (or AWS_S3_BUCKET) is not configured');
    }
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    return presign(this.client, command, { expiresIn });
  }

  private buildPublicUrl(key: string) {
    if (!this.bucket) {
      throw new Error('AWS_KYC_S3_BUCKET (or AWS_S3_BUCKET) is not configured');
    }
    const baseDomain =
      this.region === 'us-east-1'
        ? `https://${this.bucket}.s3.amazonaws.com`
        : `https://${this.bucket}.s3.${this.region}.amazonaws.com`;
    return `${baseDomain}/${key}`;
  }

  private generateKey(prefix: string, docType: KycDocumentType) {
    const nano = process.hrtime.bigint().toString();
    const hash = createHash('sha256')
      .update(`${randomUUID()}-${nano}`)
      .digest('hex')
      .slice(0, 12);
    return `${prefix}/${nano}-${docType}-${hash}`;
  }
}
