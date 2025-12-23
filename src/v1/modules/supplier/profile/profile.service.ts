import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from '../../../entities/supplier.entity';
import { User } from '../../../entities/user.entity';
import {
  UpdateSupplierPasswordDto,
  UpdateSupplierRequestDto,
} from './profile.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SupplierProfileService {
  constructor(
    @InjectRepository(Supplier)
    private readonly suppliers: Repository<Supplier>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  async getProfile(userId: string): Promise<User> {
    const supplierUser = await this.users.findOne({
      where: { id: userId },
      relations: ['supplier'],
    });
    if (!supplierUser) throw new NotFoundException('Supplier not found');
    return supplierUser;
  }

  async updateProfile(
    userId: string,
    dto: UpdateSupplierRequestDto,
  ): Promise<Supplier> {
    const supplierUser = await this.getProfile(userId);

    if (!supplierUser.supplier) {
      throw new NotFoundException('Supplier profile not found');
    }

    // 1️⃣ Update Supplier (business)
    if (dto.business) {
      Object.assign(supplierUser.supplier, dto.business);
      await this.suppliers.save(supplierUser.supplier);
    }

    // 2️⃣ Update User (profile)
    if (dto.profile) {
      Object.assign(supplierUser, dto.profile);
      await this.users.save(supplierUser);
    }

    return supplierUser.supplier;
  }

  async updatePassword(
    userId: string,
    dto: UpdateSupplierPasswordDto,
  ): Promise<Omit<User, 'password'>> {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    const matches = await bcrypt.compare(dto.currentPassword, user.password);
    if (!matches) {
      throw new BadRequestException('Current password is incorrect');
    }
    user.password = dto.newPassword;
    const saved = await this.users.save(user);
    return saved.toPublic();
  }
}
