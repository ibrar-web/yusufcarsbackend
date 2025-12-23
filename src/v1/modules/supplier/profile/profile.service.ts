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
  UpdateSupplierFlatDto,
  UpdateSupplierPasswordDto,
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
    dto: UpdateSupplierFlatDto,
  ): Promise<Supplier> {
    const supplierUser = await this.getProfile(userId);

    if (!supplierUser.supplier) {
      throw new NotFoundException('Supplier profile not found');
    }

    // 🔹 USER fields (MUST be keys of User)
    const userFields = ['email', 'firstName', 'lastName', 'postCode'] as const;
    type UserField = (typeof userFields)[number];

    // 🔹 SUPPLIER fields (MUST be keys of Supplier)
    const supplierFields = [
      'businessName',
      'tradingAs',
      'description',
      'addressLine1',
      'addressLine2',
      'city',
      'phone',
    ] as const;
    type SupplierField = (typeof supplierFields)[number];

    const userUpdate: Partial<Pick<User, UserField>> = {};
    const supplierUpdate: Partial<Pick<Supplier, SupplierField>> = {};

    for (const key of userFields) {
      const value = dto[key];
      if (value !== undefined && value !== null) {
        userUpdate[key] = value as User[typeof key];
      }
    }

    for (const key of supplierFields) {
      const value = dto[key];
      if (value !== undefined && value !== null) {
        supplierUpdate[key] = value as Supplier[typeof key];
      }
    }

    if (Object.keys(userUpdate).length) {
      Object.assign(supplierUser, userUpdate);
      await this.users.save(supplierUser);
    }

    if (Object.keys(supplierUpdate).length) {
      Object.assign(supplierUser.supplier, supplierUpdate);
      await this.suppliers.save(supplierUser.supplier);
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
