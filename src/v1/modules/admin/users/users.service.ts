import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { User } from '../../../entities/user.entity';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';

type ListUsersParams = {
  page?: number;
  limit?: number;
  email?: string;
  name?: string;
  role?: User['role'];
  isActive?: boolean;
  sortBy?: keyof User;
  sortDir?: 'ASC' | 'DESC';
};

@Injectable()
export class AdminUsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async list(params: ListUsersParams) {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit =
      params.limit && params.limit > 0 ? Math.min(params.limit, 100) : 20;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<User> = {
      ...{ role: 'user' },
      ...(params.isActive === undefined ? {} : { isActive: params.isActive }),
      ...(params.email ? { email: ILike(`%${params.email}%`) } : {}),
      ...(params.name ? { fullName: ILike(`%${params.name}%`) } : {}),
    };

    const orderKey = params.sortBy || 'createdAt';
    const orderDir = params.sortDir || 'DESC';

    const [data, total] = await this.users.findAndCount({
      where,
      select: {
        id: true,
        fullName: true,
        email: true,
        isActive: true,
        postCode: true,
        createdAt: true,
        role: true,
      },
      order: { [orderKey]: orderDir },
      skip,
      take: limit,
    });

    return { data, meta: { total, page, limit } };
  }

  async findOne(id: string) {
    const user = await this.users.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async create(dto: CreateAdminUserDto) {
    const user = this.users.create({
      ...dto,
      role: dto.role ?? 'user',
      isActive: dto.isActive ?? true,
    });
    await this.users.save(user);
    return user;
  }

  async update(id: string, dto: UpdateAdminUserDto) {
    const user = await this.findOne(id);
    Object.assign(user, dto);
    return this.users.save(user);
  }

  async activate(id: string) {
    return this.users.save({ ...(await this.findOne(id)), isActive: true });
  }

  async deactivate(id: string) {
    return this.users.save({ ...(await this.findOne(id)), isActive: false });
  }

  async remove(id: string) {
    const user = await this.findOne(id);
    await this.users.remove(user);
    return { deleted: true };
  }
}
