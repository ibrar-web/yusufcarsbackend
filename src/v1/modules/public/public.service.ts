import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Express } from 'express';
import { extname } from 'node:path';
import { Inquiries, UrgencyLevel } from '../../entities/inquiries.entity';
import { S3Service, type UploadedFile } from '../../common/aws/s3.service';
import { CreateInquiryDto } from './dto/create-inquiry.dto';

const INQUIRY_UPLOAD_PREFIX = 'public/inquiries';
type NormalizedMulterFile = Pick<
  Express.Multer.File,
  'originalname' | 'mimetype' | 'size'
> & { buffer: Buffer };
export type InquirySubmissionResult = Pick<
  Inquiries,
  'id' | 'status' | 'createdAt'
>;

@Injectable()
export class PublicInquiriesService {
  constructor(
    @InjectRepository(Inquiries)
    private readonly enquiries: Repository<Inquiries>,
    private readonly s3: S3Service,
  ) {}

  async create(
    dto: CreateInquiryDto,
    file?: Express.Multer.File,
  ): Promise<InquirySubmissionResult> {
    const enquiry = this.enquiries.create({
      fullName: dto.fullName.trim(),
      email: dto.email.toLowerCase().trim(),
      subject: dto.subject.trim(),
      content: dto.content.trim(),
      urgency: dto.urgency ?? UrgencyLevel.NORMAL,
      contact: dto.contact ?? false,
    });

    if (file) {
      const fileKey = await this.uploadAttachment(file);
      enquiry.fileKey = fileKey;
      enquiry.fileName = file.originalname;
    }

    const saved = await this.enquiries.save(enquiry);
    return {
      id: saved.id,
      status: saved.status,
      createdAt: saved.createdAt,
    };
  }

  private async uploadAttachment(file: Express.Multer.File): Promise<string> {
    const normalized = this.normalizeFile(file);
    const key = this.buildAttachmentKey(normalized.originalname);
    await this.s3.upload(key, this.toUploadedFile(normalized));
    return key;
  }

  private toUploadedFile(file: NormalizedMulterFile): UploadedFile {
    const { buffer, originalname, mimetype, size } = file;
    return { buffer, originalname, mimetype, size };
  }

  private normalizeFile(file: Express.Multer.File): NormalizedMulterFile {
    if (!file || typeof file !== 'object') {
      throw new Error('Invalid uploaded file');
    }
    if (!Buffer.isBuffer(file.buffer)) {
      throw new Error('Uploaded file buffer must be available');
    }
    return {
      buffer: file.buffer,
      originalname: file.originalname || 'attachment',
      mimetype: file.mimetype || 'application/octet-stream',
      size: file.size ?? file.buffer.length,
    };
  }

  private buildAttachmentKey(filename?: string): string {
    const timestamp = Date.now();
    if (!filename) {
      return `${INQUIRY_UPLOAD_PREFIX}/${timestamp}`;
    }

    const extension = extname(filename).toLowerCase();
    const suffix = extension || '';
    return `${INQUIRY_UPLOAD_PREFIX}/${timestamp}${suffix}`;
  }
}
