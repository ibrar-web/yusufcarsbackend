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
  UpdateSupplierProfileDto,
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

  async getProfile(userId: string) {
    const supplier = await this.suppliers.findOne({
      where: { user: { id: userId } as any },
    });
    if (!supplier) throw new NotFoundException('Supplier not found');
    return supplier;
  }

  async updateProfile(userId: string, dto: UpdateSupplierProfileDto) {
    const supplier = await this.getProfile(userId);
    Object.assign(supplier, dto);
    return this.suppliers.save(supplier);
  }

  async updatePassword(userId: string, dto: UpdateSupplierPasswordDto) {
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
