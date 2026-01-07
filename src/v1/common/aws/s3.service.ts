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
  private readonly publicBucket?: string;
  private readonly publicRegion: string;
  private readonly publicClient?: S3Client;

  constructor() {
    this.region = process.env.AWS_REGION || 'eu-north-1';
    this.bucket = process.env.AWS_KYC_S3_BUCKET || process.env.AWS_S3_BUCKET;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID || '';
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || '';
    this.client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    this.publicBucket = process.env.AWS_S3_BUCKET;
    this.publicRegion = process.env.AWS_PUBLIC_REGION || this.region;
    if (this.publicBucket) {
      const publicAccessKeyId =
        process.env.AWS_PUBLIC_ACCESS_KEY_ID || accessKeyId;
      const publicSecretAccessKey =
        process.env.AWS_PUBLIC_SECRET_ACCESS_KEY || secretAccessKey;
      this.publicClient = new S3Client({
        region: this.publicRegion,
        credentials: {
          accessKeyId: publicAccessKeyId,
          secretAccessKey: publicSecretAccessKey,
        },
      });
    }
  }

  async uploadKycDocument(
    prefix: string,
    file: UploadedFile,
    docType: KycDocumentType,
  ): Promise<{ key: string; url: string }> {
    const key = this.generateKey(`${prefix}/${docType}`, docType);
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
    return this.buildUrl(this.bucket, this.region, key);
  }

  async uploadPublic(key: string, file: UploadedFile): Promise<string> {
    if (!this.publicBucket || !this.publicClient) {
      throw new Error('AWS_S3_BUCKET (public) is not configured');
    }
    const command = new PutObjectCommand({
      Bucket: this.publicBucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
    });
    try {
      await this.publicClient.send(command);
    } catch (error) {
      if (this.isAclNotSupported(error)) {
        const fallback = new PutObjectCommand({
          Bucket: this.publicBucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        });
        await this.publicClient.send(fallback);
      } else {
        throw error;
      }
    }
    return this.buildUrl(this.publicBucket, this.publicRegion, key);
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

  private buildUrl(bucket: string, region: string, key: string) {
    const baseDomain =
      region === 'us-east-1'
        ? `https://${bucket}.s3.amazonaws.com`
        : `https://${bucket}.s3.${region}.amazonaws.com`;
    return `${baseDomain}/${key}`;
  }

  private isAclNotSupported(error: unknown): boolean {
    if (!(error instanceof Error)) return false;
    return (
      error.name === 'AccessControlListNotSupported' ||
      error.message.includes('AccessControlListNotSupported')
    );
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
