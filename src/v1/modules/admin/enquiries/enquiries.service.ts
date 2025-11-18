import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { QuoteRequest } from '../../quotes/quote-request.entity';
import { AssignEnquiryDto } from './dto/assign-enquiry.dto';
import { UpdateEnquiryStatusDto } from './dto/update-enquiry-status.dto';
import { AddEnquiryNoteDto } from './dto/add-enquiry-note.dto';

type ListParams = {
  page?: number;
  limit?: number;
  status?: QuoteRequest['status'];
  from?: string;
  to?: string;
  sortDir?: 'ASC' | 'DESC';
};

@Injectable()
export class AdminEnquiriesService {
  constructor(@InjectRepository(QuoteRequest) private readonly enquiries: Repository<QuoteRequest>) {}

  async list(params: ListParams) {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit = params.limit && params.limit > 0 ? Math.min(params.limit, 100) : 20;
    const skip = (page - 1) * limit;

    const qb = this.enquiries.createQueryBuilder('enquiry').leftJoinAndSelect('enquiry.user', 'user');

    if (params.status) qb.andWhere('enquiry.status = :status', { status: params.status });
    if (params.from && params.to) {
      qb.andWhere('enquiry.createdAt BETWEEN :from AND :to', { from: new Date(params.from), to: new Date(params.to) });
    } else if (params.from) {
      qb.andWhere('enquiry.createdAt >= :from', { from: new Date(params.from) });
    } else if (params.to) {
      qb.andWhere('enquiry.createdAt <= :to', { to: new Date(params.to) });
    }

    qb.orderBy('enquiry.createdAt', params.sortDir || 'DESC').skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, meta: { total, page, limit } };
  }

  async findOne(id: string) {
    const enquiry = await this.enquiries.findOne({ where: { id }, relations: ['user'] });
    if (!enquiry) throw new NotFoundException('Enquiry not found');
    return enquiry;
  }

  async assign(id: string, dto: AssignEnquiryDto) {
    const enquiry = await this.findOne(id);
    enquiry.assignedToInternal = dto.assignedTo;
    return this.enquiries.save(enquiry);
  }

  async updateStatus(id: string, dto: UpdateEnquiryStatusDto) {
    const enquiry = await this.findOne(id);
    enquiry.status = dto.status;
    if (dto.internalNotes) {
      enquiry.internalNotes = dto.internalNotes;
    }
    return this.enquiries.save(enquiry);
  }

  async addNote(id: string, dto: AddEnquiryNoteDto) {
    const enquiry = await this.findOne(id);
    const existing = enquiry.internalNotes ? `${enquiry.internalNotes}\n` : '';
    enquiry.internalNotes = `${existing}${dto.note}`;
    return this.enquiries.save(enquiry);
  }
}
