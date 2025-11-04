import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { User } from '../users/user.entity';
import { Supplier } from '../suppliers/supplier.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Supplier) private readonly suppliers: Repository<Supplier>,
  ) {}

  async stats() {
    const totalUsers = await this.users.count();
    const totalSuppliers = await this.suppliers.count();
    const pendingQuotes = 0;
    const acceptedQuotes = 0;
    return { totalUsers, totalSuppliers, pendingQuotes, acceptedQuotes };
  }

  async listUsers(params: { role?: User['role']; active?: boolean; skip?: number; take?: number }) {
    return this.users.find({
      where: {
        ...(params.role ? { role: params.role } : {}),
        ...(params.active === undefined ? {} : { isActive: params.active }),
      },
      order: { createdAt: 'DESC' },
      skip: params.skip ?? 0,
      take: params.take ?? 50,
    });
  }

  async listSuppliers(params: { isVerified?: boolean; postcode?: string; category?: string; skip?: number; take?: number }) {
    return this.suppliers.find({
      where: {
        ...(params.isVerified === undefined ? {} : { isVerified: params.isVerified }),
        ...(params.postcode ? { postCode: params.postcode } : {}),
        ...(params.category ? { categories: Not('') } : {}),
      },
      order: { createdAt: 'DESC' },
      skip: params.skip ?? 0,
      take: params.take ?? 50,
    });
  }

  async verifySupplier(id: string) {
    const s = await this.suppliers.findOne({ where: { id } });
    if (!s) throw new NotFoundException('Supplier not found');
    s.isVerified = true;
    return this.suppliers.save(s);
  }

  async deactivateSupplier(id: string) {
    const s = await this.suppliers.findOne({ where: { id } });
    if (!s) throw new NotFoundException('Supplier not found');
    s.isActive = false;
    return this.suppliers.save(s);
  }

  async seedAdmin(email: string, password: string) {
    const exists = await this.users.findOne({ where: { role: 'admin' } });
    if (exists) return { created: false };
    const user = this.users.create({ email, password, fullName: 'Admin', role: 'admin', isActive: true });
    await this.users.save(user);
    return { created: true, adminId: user.id };
  }
}


