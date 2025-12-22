import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import type { Express } from 'express';
import type { StorageEngine } from 'multer';
import * as multer from 'multer';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import {
  PublicInquiriesService,
  type InquirySubmissionResult,
} from './public.service';

const attachmentStorage: StorageEngine = createMemoryStorage();
const attachmentUploadOptions: MulterOptions = {
  storage: attachmentStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
};

function createMemoryStorage(): StorageEngine {
  const storage = multer.memoryStorage();
  if (!storage || typeof storage !== 'object') {
    throw new Error('Failed to initialize in-memory storage');
  }
  return storage;
}

@Controller('public/inquiries')
export class PublicInquiriesController {
  constructor(private readonly enquiries: PublicInquiriesService) {}

  @Post()
  @UseInterceptors(FileInterceptor('attachment', attachmentUploadOptions))
  submit(
    @Body() dto: CreateInquiryDto,
    @UploadedFile() attachment?: Express.Multer.File,
  ): Promise<InquirySubmissionResult> {
    return this.enquiries.create(dto, attachment);
  }
}
