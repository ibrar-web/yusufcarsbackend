import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../entities/user.entity';
import { UpdateUserPasswordDto, UpdateUserProfileDto } from './profile.dto';
import { GoogleGeocodingService } from '../../../common/geocoding/google-geocoding.service';
import * as bcrypt from 'bcrypt';
import { S3Service } from '../../../common/aws/s3.service';
import { applyProfileCompletion } from '../../../common/utils/profile-completion.util';
import type { Express } from 'express';

@Injectable()
export class UserProfileService {
  private readonly logger = new Logger(UserProfileService.name);

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly geocoding: GoogleGeocodingService,
    private readonly s3: S3Service,
  ) {}

  async getProfile(userId: string) {
    const user = await this.users.findOne({
      where: { id: userId },
      relations: { supplier: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return user.toPublic();
  }

  async updateProfile(userId: string, dto: UpdateUserProfileDto) {
    const user = await this.users.findOne({
      where: { id: userId },
      relations: { supplier: true },
    });
    if (!user) throw new NotFoundException('User not found');

    if (dto.firstName !== undefined) user.firstName = dto.firstName;
    if (dto.lastName !== undefined) user.lastName = dto.lastName;
    if (dto.email !== undefined) user.email = dto.email;
    if (dto.marketingOptIn !== undefined)
      (user as User & { marketingOptIn?: boolean }).marketingOptIn =
        dto.marketingOptIn;
    if (dto.phone !== undefined) user.phone = dto.phone;

    if (dto.postCode?.trim()) {
      const normalized = dto.postCode.trim();
      user.postCode = normalized;
      const coordinates = await this.lookupCoordinates(normalized);
      if (coordinates) {
        user.latitude = coordinates.latitude;
        user.longitude = coordinates.longitude;
      }
    }
    applyProfileCompletion(user, user.supplier);
    const saved = await this.users.save(user);
    return saved.toPublic();
  }

  async updatePassword(userId: string, dto: UpdateUserPasswordDto) {
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

  async updateProfileImage(userId: string, file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }
    const user = await this.users.findOne({
      where: { id: userId },
      relations: { supplier: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const key = `profiles/${user.id}/avatar-${Date.now()}`;
    const url = await this.s3.uploadPublic(key, {
      buffer: file.buffer,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    });
    user.profileImageKey = key;
    user.profileImageUrl = url;
    applyProfileCompletion(user, user.supplier);
    const saved = await this.users.save(user);
    return saved.toPublic();
  }

  private async lookupCoordinates(postCode: string) {
    try {
      return await this.geocoding.lookupPostcode(postCode);
    } catch (error) {
      this.logger.error(
        `Failed to lookup coordinates for ${postCode}`,
        error instanceof Error ? error.stack : undefined,
      );
      return null;
    }
  }
}
