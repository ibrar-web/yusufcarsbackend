import { Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { createHash, createHmac, randomUUID } from 'crypto';

export type UploadedFile = {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size?: number;
};

type KycDocumentType = 'company-reg' | 'insurance';

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
    const credentials = await this.client.config.credentials();
    const hostname =
      this.region === 'us-east-1'
        ? `${this.bucket}.s3.amazonaws.com`
        : `${this.bucket}.s3.${this.region}.amazonaws.com`;
    const encodedKey = encodeURIComponent(key).replace(/%2F/g, '/');
    const algorithm = 'AWS4-HMAC-SHA256';
    const date = new Date();
    const amzDate = date.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.substring(0, 8);
    const credentialScope = `${dateStamp}/${this.region}/s3/aws4_request`;
    const signedHeaders = 'host';
    const credential = encodeURIComponent(
      `${credentials.accessKeyId}/${credentialScope}`,
    );

    const queryParams = [
      `X-Amz-Algorithm=${algorithm}`,
      `X-Amz-Credential=${credential}`,
      `X-Amz-Date=${amzDate}`,
      `X-Amz-Expires=${expiresIn}`,
      `X-Amz-SignedHeaders=${signedHeaders}`,
    ];

    if (credentials.sessionToken) {
      queryParams.push(
        `X-Amz-Security-Token=${encodeURIComponent(credentials.sessionToken)}`,
      );
    }

    const canonicalRequest = [
      'GET',
      `/${encodedKey}`,
      queryParams.sort().join('&'),
      `host:${hostname}\n`,
      signedHeaders,
      'UNSIGNED-PAYLOAD',
    ].join('\n');

    const hashedCanonicalRequest = createHash('sha256')
      .update(canonicalRequest)
      .digest('hex');
    const stringToSign = [
      algorithm,
      amzDate,
      credentialScope,
      hashedCanonicalRequest,
    ].join('\n');

    const signingKey = this.getSigningKey(
      credentials.secretAccessKey,
      dateStamp,
      this.region,
      's3',
    );
    const signature = createHmac('sha256', signingKey)
      .update(stringToSign)
      .digest('hex');

    const url = `https://${hostname}/${encodedKey}?${queryParams
      .sort()
      .join('&')}&X-Amz-Signature=${signature}`;
    return url;
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

  private getSigningKey(
    secretKey: string,
    dateStamp: string,
    regionName: string,
    serviceName: string,
  ) {
    const kDate = createHmac('sha256', `AWS4${secretKey}`)
      .update(dateStamp)
      .digest();
    const kRegion = createHmac('sha256', kDate).update(regionName).digest();
    const kService = createHmac('sha256', kRegion).update(serviceName).digest();
    const kSigning = createHmac('sha256', kService)
      .update('aws4_request')
      .digest();
    return kSigning;
  }
}
