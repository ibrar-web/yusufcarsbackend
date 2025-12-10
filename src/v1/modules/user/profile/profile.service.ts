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

@Injectable()
export class UserProfileService {
  private readonly logger = new Logger(UserProfileService.name);

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly geocoding: GoogleGeocodingService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, dto: UpdateUserProfileDto) {
    const user = await this.getProfile(userId);
    Object.assign(user, dto);
    if (dto.postCode?.trim()) {
      const normalized = dto.postCode.trim();
      user.postCode = normalized;
      const coordinates = await this.lookupCoordinates(normalized);
      if (coordinates) {
        user.latitude = coordinates.latitude;
        user.longitude = coordinates.longitude;
      }
    }
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
