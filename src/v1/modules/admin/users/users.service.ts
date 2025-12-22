import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { User, UserStatus } from '../../../entities/user.entity';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';

type ListUsersParams = {
  page?: number;
  limit?: number;
  query?: string;
  status?: UserStatus;
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

    const base: FindOptionsWhere<User> = {
      role: 'user',
      ...(params.status ? { status: params.status } : {}),
    };

    let where: FindOptionsWhere<User>[] = [];

    if (params.query) {
      const q = ILike(`%${params.query}%`);
      where = [
        { ...base, email: q },
        { ...base, firstName: q },
        { ...base, lastName: q },
      ];
    } else {
      where = [base];
    }

    const orderKey = params.sortBy || 'createdAt';
    const orderDir = params.sortDir || 'DESC';

    const [data, total] = await this.users.findAndCount({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        status: true,
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

  async update(id: string, dto: UpdateAdminUserDto) {
    const user = await this.findOne(id);
    Object.assign(user, dto);
    return this.users.save(user);
  }

  async enable(id: string) {
    const user = await this.findOne(id);
    user.status = UserStatus.ACTIVE;
    user.suspensionReason = null;
    return this.users.save(user);
  }

  async disable(id: string, reason: string) {
    const user = await this.findOne(id);
    user.status = UserStatus.SUSPENDED;
    user.suspensionReason = reason;
    return this.users.save(user);
  }

  async remove(id: string) {
    const user = await this.findOne(id);
    await this.users.remove(user);
    return { deleted: true };
  }
}
