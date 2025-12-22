import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Inquiries,
  InquiryStatus,
  UrgencyLevel,
} from '../../../entities/inquiries.entity';
import { UpdateEnquiryStatusDto } from './dto/update-enquiry-status.dto';
import { S3Service } from '../../../common/aws/s3.service';

type ListParams = {
  page?: number;
  limit?: number;
  status?: InquiryStatus;
  urgency?: UrgencyLevel;
  contact?: boolean;
  sortDir?: 'ASC' | 'DESC';
  search?: string;
};

@Injectable()
export class AdminEnquiriesService {
  constructor(
    @InjectRepository(Inquiries)
    private readonly enquiries: Repository<Inquiries>,
    private readonly s3: S3Service,
  ) {}

  async list(params: ListParams) {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit =
      params.limit && params.limit > 0 ? Math.min(params.limit, 100) : 20;
    const skip = (page - 1) * limit;

    const qb = this.enquiries.createQueryBuilder('enquiry');

    if (params.status) {
      qb.andWhere('enquiry.status = :status', { status: params.status });
    }
    if (params.urgency) {
      qb.andWhere('enquiry.urgency = :urgency', { urgency: params.urgency });
    }
    if (typeof params.contact === 'boolean') {
      qb.andWhere('enquiry.contact = :contact', { contact: params.contact });
    }
    if (params.search) {
      const term = `%${params.search.trim().toLowerCase()}%`;
      qb.andWhere(
        `(LOWER(enquiry.fullName) LIKE :term OR LOWER(enquiry.email) LIKE :term OR LOWER(enquiry.subject) LIKE :term OR LOWER(enquiry.content) LIKE :term)`,
        { term },
      );
    }

    qb.orderBy('enquiry.createdAt', params.sortDir || 'DESC')
      .skip(skip)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, meta: { total, page, limit } };
  }

  async findOne(id: string) {
    const enquiry = await this.enquiries.findOne({ where: { id } });
    if (!enquiry) throw new NotFoundException('Enquiry not found');

    let fileSignedUrl: string | undefined;
    if (enquiry.fileKey) {
      fileSignedUrl = await this.s3.getSignedUrl(enquiry.fileKey);
    }

    if (enquiry.status === InquiryStatus.PENDING) {
      enquiry.status = InquiryStatus.COMPLETED;
      await this.enquiries.save(enquiry);
    }

    return {
      ...enquiry,
      fileSignedUrl,
    };
  }

  async updateStatus(id: string, dto: UpdateEnquiryStatusDto) {
    const enquiry = await this.findOne(id);
    enquiry.status = dto.status;
    return this.enquiries.save(enquiry);
  }
}
