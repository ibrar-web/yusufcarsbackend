import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PromotionStatus,
  SupplierPromotion,
} from '../../../entities/supplier-promotion.entity';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { User } from '../../../entities/user.entity';
import { ServiceCategory } from '../../../entities/services/service-category.entity';
import { ServiceItem } from '../../../entities/services/service-item.entity';

@Injectable()
export class SupplierPromotionsService {
  constructor(
    @InjectRepository(SupplierPromotion)
    private readonly promotions: Repository<SupplierPromotion>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(ServiceCategory)
    private readonly categories: Repository<ServiceCategory>,
    @InjectRepository(ServiceItem)
    private readonly items: Repository<ServiceItem>,
  ) {}

  listForSupplier(supplierId: string) {
    return this.promotions.find({
      where: { supplier: { id: supplierId } },
      order: { startsAt: 'DESC' },
    });
  }

  async createPromotion(supplierId: string, dto: CreatePromotionDto) {
    const supplier = await this.users.findOne({ where: { id: supplierId } });
    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }
    const { start, end } = this.parseSchedule(dto.startsAt, dto.endsAt);
    const { category, item } = await this.resolveTargets(
      dto.serviceCategoryId,
      dto.serviceItemId,
    );
    const promotion = this.promotions.create({
      supplier,
      title: dto.title,
      description: dto.description,
      discountType: dto.discountType,
      discountValue: dto.discountValue,
      startsAt: start,
      endsAt: end,
      targetCategory: category ?? null,
      targetItem: item ?? null,
      status: this.computeStatus(start, end),
    });
    return this.promotions.save(promotion);
  }

  async updatePromotion(
    supplierId: string,
    promotionId: string,
    dto: UpdatePromotionDto,
  ) {
    const promotion = await this.promotions.findOne({
      where: { id: promotionId, supplier: { id: supplierId } },
    });
    if (!promotion) {
      throw new NotFoundException('Promotion not found');
    }
    if (dto.title !== undefined) promotion.title = dto.title;
    if (dto.description !== undefined) promotion.description = dto.description;
    if (dto.discountType !== undefined)
      promotion.discountType = dto.discountType;
    if (dto.discountValue !== undefined)
      promotion.discountValue = dto.discountValue;

    if (dto.startsAt || dto.endsAt) {
      const { start, end } = this.parseSchedule(
        dto.startsAt ?? promotion.startsAt.toISOString(),
        dto.endsAt ?? promotion.endsAt.toISOString(),
      );
      promotion.startsAt = start;
      promotion.endsAt = end;
      promotion.status = this.computeStatus(start, end);
    }
    if (
      dto.serviceCategoryId !== undefined ||
      dto.serviceItemId !== undefined
    ) {
      const { category, item } = await this.resolveTargets(
        dto.serviceCategoryId ?? promotion.targetCategory?.id,
        dto.serviceItemId ?? promotion.targetItem?.id,
      );
      promotion.targetCategory = category ?? null;
      promotion.targetItem = item ?? null;
    }
    return this.promotions.save(promotion);
  }

  private parseSchedule(rawStart: string, rawEnd: string) {
    const start = new Date(rawStart);
    const end = new Date(rawEnd);
    if (Number.isNaN(start.getTime())) {
      throw new BadRequestException('Invalid startsAt value');
    }
    if (Number.isNaN(end.getTime())) {
      throw new BadRequestException('Invalid endsAt value');
    }
    if (end <= start) {
      throw new BadRequestException('endsAt must be later than startsAt');
    }
    return { start, end };
  }

  private async resolveTargets(
    categoryId?: string,
    serviceItemId?: string,
  ): Promise<{
    category?: ServiceCategory | null;
    item?: ServiceItem | null;
  }> {
    let category: ServiceCategory | null | undefined;
    let item: ServiceItem | null | undefined;
    if (categoryId) {
      category = await this.categories.findOne({ where: { id: categoryId } });
      if (!category) {
        throw new NotFoundException('Service category not found');
      }
    }
    if (serviceItemId) {
      item = await this.items.findOne({
        where: { id: serviceItemId },
        relations: ['subcategory', 'subcategory.category'],
      });
      if (!item) {
        throw new NotFoundException('Service item not found');
      }
      if (category && item.subcategory?.category?.id !== category.id) {
        throw new BadRequestException(
          'Service item must belong to the selected category',
        );
      }
      if (!category) {
        category = item.subcategory?.category ?? null;
      }
    }
    return { category: category ?? null, item: item ?? null };
  }

  private computeStatus(start: Date, end: Date) {
    const now = new Date();
    if (end <= now) return PromotionStatus.EXPIRED;
    if (start > now) return PromotionStatus.SCHEDULED;
    return PromotionStatus.ACTIVE;
  }
}
