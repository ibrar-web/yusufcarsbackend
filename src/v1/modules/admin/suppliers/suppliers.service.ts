import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { Supplier } from '../../../entities/supplier.entity';
import { UpdateAdminSupplierDto } from './dto/update-admin-supplier.dto';
import { User } from 'src/v1/entities/user.entity';

type ListSuppliersParams = {
  page?: number;
  limit?: number;
  isVerified?: boolean;
  isActive?: boolean;
  query?: string;
};

@Injectable()
export class AdminSuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private readonly suppliers: Repository<Supplier>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  async list(params: ListSuppliersParams) {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit =
      params.limit && params.limit > 0 ? Math.min(params.limit, 100) : 20;
    const skip = (page - 1) * limit;

    const base: FindOptionsWhere<User> = {
      role: 'supplier',
      ...(params.isActive !== undefined && { isActive: params.isActive }),
    };

    let where: FindOptionsWhere<User>[] = [];

    if (params.query) {
      const q = ILike(`%${params.query}%`);
      where = [
        { ...base, email: q },
        { ...base, fullName: q },
      ];
    } else {
      where = [base];
    }

    const orderKey = 'createdAt';
    const orderDir = 'DESC';

    const [data, total] = await this.users.findAndCount({
      where,
      order: { [orderKey]: orderDir },
      skip,
      take: limit,
    });

    return { data, meta: { total, page, limit } };
  }

  async findOne(id: string) {
    const supplier = await this.suppliers.findOne({ where: { user: { id } } });
    if (!supplier) throw new NotFoundException('Supplier not found');
    return supplier;
  }

  async update(id: string, dto: UpdateAdminSupplierDto) {
    const supplier = await this.findOne(id);
    Object.assign(supplier, dto);
    return this.suppliers.save(supplier);
  }

  async approve(id: string) {
    return this.suppliers.save({
      ...(await this.findOne(id)),
      isVerified: true,
    });
  }

  async reject(id: string) {
    return this.suppliers.save({
      ...(await this.findOne(id)),
      isVerified: false,
    });
  }

  async enable(id: string) {
    return this.suppliers.save({ ...(await this.findOne(id)), isActive: true });
  }

  async disable(id: string) {
    return this.suppliers.save({
      ...(await this.findOne(id)),
      isActive: false,
    });
  }

  async getDocuments(id: string) {
    const supplier = await this.findOne(id);
    return {
      companyRegDoc: supplier.companyRegDoc,
      insuranceDoc: supplier.insuranceDoc,
    };
  }
}
