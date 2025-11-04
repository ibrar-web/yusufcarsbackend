import { Injectable, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';
import { User } from '../users/user.entity';
import { Supplier } from '../suppliers/supplier.entity';
import { JoseService } from './jose.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Supplier)
    private readonly suppliers: Repository<Supplier>,
    private readonly jose: JoseService,
  ) {}

  async register(dto: {
    email: string;
    password: string;
    fullName: string;
    role?: User['role'];
    supplier?: Partial<Supplier>;
  }) {
    const existing = await this.users.findOne({ where: { email: dto.email } });
    if (existing) throw new BadRequestException('Email already in use');

    const user = this.users.create({
      email: dto.email,
      password: dto.password,
      fullName: dto.fullName,
      role: dto.role ?? 'user',
    });
    await this.users.save(user);

    if (user.role === 'supplier') {
      const supplier = this.suppliers.create({
        ...dto.supplier,
        user,
        isVerified: false,
        isActive: true,
      });
      await this.suppliers.save(supplier);
    }
    return user.toPublic();
  }

  async validateUser(email: string, password: string) {
    const user = await this.users.findOne({ where: { email } });
    if (!user) return null;
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return null;
    return user.toPublic();
  }

  async login(res: Response, userPublic: any) {
    const token = await this.jose.sign({
      sub: userPublic.id,
      email: userPublic.email,
      role: userPublic.role,
    });
    const cookieName = process.env.COOKIE_NAME || 'access_token';
    const domain = process.env.COOKIE_DOMAIN || undefined;
    const secure = process.env.NODE_ENV === 'production';
    const maxAge = (() => {
      const s = process.env.TOKEN_EXPIRES_IN || '1d';
      const m = /^([0-9]+)([smhd])$/.exec(s) || [];
      const n = parseInt(m[1] || '1', 10);
      const mult =
        m[2] === 's' ? 1 : m[2] === 'm' ? 60 : m[2] === 'h' ? 3600 : 86400;
      return n * mult * 1000;
    })();

    res.cookie(cookieName, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure,
      domain,
      maxAge,
      path: '/',
    });
    return userPublic;
  }
}
