import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from './supplier.entity';

@Injectable()
export class SuppliersService {
  constructor(@InjectRepository(Supplier) private readonly suppliers: Repository<Supplier>) {}

  async list(params?: { isVerified?: boolean; postCode?: string; category?: string }) {
    return this.suppliers.find({
      where: {
        ...(params?.isVerified === undefined ? {} : { isVerified: params.isVerified }),
        ...(params?.postCode ? { postCode: params.postCode } : {}),
      },
      order: { createdAt: 'DESC' },
    });
  }

  async getMine(userId: string) {
    const s = await this.suppliers.findOne({ where: { user: { id: userId } as any } });
    if (!s) throw new NotFoundException('Supplier not found');
    return s;
  }

  async update(id: string, userId: string, dto: Partial<Supplier>, isAdmin: boolean) {
    const s = await this.suppliers.findOne({ where: { id } });
    if (!s) throw new NotFoundException('Supplier not found');
    if (!isAdmin && s.user.id !== userId) throw new ForbiddenException('Cannot update this supplier');
    Object.assign(s, dto);
    return await this.suppliers.save(s);
  }

  async verify(id: string) {
    const s = await this.suppliers.findOne({ where: { id } });
    if (!s) throw new NotFoundException('Supplier not found');
    s.isVerified = true;
    return await this.suppliers.save(s);
  }

  async deactivate(id: string) {
    const s = await this.suppliers.findOne({ where: { id } });
    if (!s) throw new NotFoundException('Supplier not found');
    s.isActive = false;
    return await this.suppliers.save(s);
  }
}


