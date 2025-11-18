import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { Supplier } from '../../../entities/supplier.entity';
import { UpdateAdminSupplierDto } from './dto/update-admin-supplier.dto';

type ListSuppliersParams = {
  page?: number;
  limit?: number;
  isVerified?: boolean;
  isActive?: boolean;
  category?: string;
  city?: string;
  sortBy?: keyof Supplier;
  sortDir?: 'ASC' | 'DESC';
};

@Injectable()
export class AdminSuppliersService {
  constructor(@InjectRepository(Supplier) private readonly suppliers: Repository<Supplier>) {}

  async list(params: ListSuppliersParams) {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit = params.limit && params.limit > 0 ? Math.min(params.limit, 100) : 20;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<Supplier> = {
      ...(params.isVerified === undefined ? {} : { isVerified: params.isVerified }),
      ...(params.isActive === undefined ? {} : { isActive: params.isActive }),
      ...(params.city ? { city: ILike(`%${params.city}%`) } : {}),
      ...(params.category ? { categories: ILike(`%${params.category}%`) } : {}),
    };

    const orderKey = params.sortBy || 'createdAt';
    const orderDir = params.sortDir || 'DESC';

    const [data, total] = await this.suppliers.findAndCount({
      where,
      order: { [orderKey]: orderDir },
      skip,
      take: limit,
    });

    return { data, meta: { total, page, limit } };
  }

  async findOne(id: string) {
    const supplier = await this.suppliers.findOne({ where: { id } });
    if (!supplier) throw new NotFoundException('Supplier not found');
    return supplier;
  }

  async update(id: string, dto: UpdateAdminSupplierDto) {
    const supplier = await this.findOne(id);
    Object.assign(supplier, dto);
    return this.suppliers.save(supplier);
  }

  async approve(id: string) {
    return this.suppliers.save({ ...(await this.findOne(id)), isVerified: true });
  }

  async reject(id: string) {
    return this.suppliers.save({ ...(await this.findOne(id)), isVerified: false });
  }

  async enable(id: string) {
    return this.suppliers.save({ ...(await this.findOne(id)), isActive: true });
  }

  async disable(id: string) {
    return this.suppliers.save({ ...(await this.findOne(id)), isActive: false });
  }

  async getDocuments(id: string) {
    const supplier = await this.findOne(id);
    return {
      companyRegDoc: supplier.companyRegDoc,
      insuranceDoc: supplier.insuranceDoc,
    };
  }
}
