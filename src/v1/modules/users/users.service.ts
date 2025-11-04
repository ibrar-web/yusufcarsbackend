import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, AppRole } from './user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}

  async findAll(params?: { role?: AppRole; isActive?: boolean }) {
    return this.users.find({
      where: {
        ...(params?.role ? { role: params.role } : {}),
        ...(params?.isActive === undefined ? {} : { isActive: params.isActive }),
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const user = await this.users.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async setRole(id: string, role: AppRole) {
    const user = await this.findOne(id);
    user.role = role;
    await this.users.save(user);
    return user.toPublic();
  }

  async setActive(id: string, isActive: boolean) {
    const user = await this.findOne(id);
    user.isActive = isActive;
    await this.users.save(user);
    return user.toPublic();
  }
}


