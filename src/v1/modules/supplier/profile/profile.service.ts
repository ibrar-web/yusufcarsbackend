import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from '../../suppliers/supplier.entity';
import { UpdateSupplierProfileDto } from './profile.dto';

@Injectable()
export class SupplierProfileService {
  constructor(@InjectRepository(Supplier) private readonly suppliers: Repository<Supplier>) {}

  async getProfile(userId: string) {
    const supplier = await this.suppliers.findOne({ where: { user: { id: userId } as any } });
    if (!supplier) throw new NotFoundException('Supplier not found');
    return supplier;
  }

  async updateProfile(userId: string, dto: UpdateSupplierProfileDto) {
    const supplier = await this.getProfile(userId);
    Object.assign(supplier, dto);
    return this.suppliers.save(supplier);
  }
}
