import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository, Not } from 'typeorm';
import { ServiceCategory } from '../../../entities/services/service-category.entity';
import { ServiceSubcategory } from '../../../entities/services/service-subcategory.entity';
import { ServiceItem } from '../../../entities/services/service-item.entity';
import { CreateServiceSubcategoryDto } from './dto/create-service-subcategory.dto';
import { UpdateServiceSubcategoryDto } from './dto/update-service-subcategory.dto';
import { CreateServiceItemDto } from './dto/create-service-item.dto';
import { UpdateServiceItemDto } from './dto/update-service-item.dto';
import { CreateServiceCategoryDto } from './dto/create-service-category.dto';
import { UpdateServiceCategoryDto } from './dto/update-service-category.dto';

@Injectable()
export class AdminServicesService {
  constructor(
    @InjectRepository(ServiceCategory)
    private readonly categories: Repository<ServiceCategory>,
    @InjectRepository(ServiceSubcategory)
    private readonly subcategories: Repository<ServiceSubcategory>,
    @InjectRepository(ServiceItem)
    private readonly items: Repository<ServiceItem>,
  ) {}

  async listCategories() {
    return this.categories.find({
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async getCategory(id: string) {
    const category = await this.categories.findOne({
      where: { id },
      relations: ['subcategories', 'subcategories.items'],
    });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async createCategory(dto: CreateServiceCategoryDto) {
    const existing = await this.categories.findOne({
      where: { slug: dto.slug },
    });
    if (existing) {
      throw new BadRequestException('Slug already in use');
    }
    const category = this.categories.create(dto);
    return this.categories.save(category);
  }

  async updateCategory(id: string, dto: UpdateServiceCategoryDto) {
    const category = await this.getCategory(id);
    if (dto.slug && dto.slug !== category.slug) {
      const existing = await this.categories.findOne({
        where: { slug: dto.slug, id: Not(id) },
      });
      if (existing) {
        throw new BadRequestException('Slug already in use');
      }
    }
    if (dto.name !== undefined) category.name = dto.name;
    if (dto.slug !== undefined) category.slug = dto.slug;
    if (dto.description !== undefined) category.description = dto.description;
    if (dto.sortOrder !== undefined) category.sortOrder = dto.sortOrder;
    return this.categories.save(category);
  }

  async deleteCategory(id: string) {
    const category = await this.categories.findOne({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');
    await this.categories.remove(category);
    return { success: true };
  }

  async listSubcategories(categoryId?: string) {
    const where: FindOptionsWhere<ServiceSubcategory> | undefined = categoryId
      ? { category: { id: categoryId } }
      : undefined;
    return this.subcategories.find({
      where,
      relations: ['category', 'items'],
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }


  async createSubcategory(
    categoryId: string,
    dto: CreateServiceSubcategoryDto,
  ) {
    const category = await this.categories.findOne({
      where: { id: categoryId },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    const existing = await this.subcategories.findOne({
      where: { slug: dto.slug },
    });
    if (existing) {
      throw new BadRequestException('Slug already in use');
    }
    const subcategory = this.subcategories.create({
      ...dto,
      category,
    });
    return this.subcategories.save(subcategory);
  }

  async updateSubcategory(id: string, dto: UpdateServiceSubcategoryDto) {
    const subcategory = await this.subcategories.findOne({
      where: { id },
      relations: ['category'],
    });
    if (!subcategory) {
      throw new NotFoundException('Subcategory not found');
    }
    if (dto.categoryId && dto.categoryId !== subcategory.category.id) {
      const category = await this.categories.findOne({
        where: { id: dto.categoryId },
      });
      if (!category) throw new NotFoundException('Category not found');
      subcategory.category = category;
    }
    if (dto.slug && dto.slug !== subcategory.slug) {
      const existing = await this.subcategories.findOne({
        where: { slug: dto.slug, id: Not(id) },
      });
      if (existing) {
        throw new BadRequestException('Slug already in use');
      }
    }
    if (dto.name !== undefined) {
      subcategory.name = dto.name;
    }
    if (dto.slug !== undefined) {
      subcategory.slug = dto.slug;
    }
    if (dto.description !== undefined) {
      subcategory.description = dto.description;
    }
    if (dto.sortOrder !== undefined) {
      subcategory.sortOrder = dto.sortOrder;
    }
    return this.subcategories.save(subcategory);
  }

  async deleteSubcategory(id: string) {
    const subcategory = await this.subcategories.findOne({ where: { id } });
    if (!subcategory) {
      throw new NotFoundException('Subcategory not found');
    }
    await this.subcategories.remove(subcategory);
    return { success: true };
  }


  async createItem(subcategoryId: string, dto: CreateServiceItemDto) {
    const subcategory = await this.subcategories.findOne({
      where: { id: subcategoryId },
    });
    if (!subcategory) throw new NotFoundException('Subcategory not found');
    const existing = await this.items.findOne({ where: { slug: dto.slug } });
    if (existing) throw new BadRequestException('Slug already in use');
    const item = this.items.create({ ...dto, subcategory });
    return this.items.save(item);
  }

  async updateItem(id: string, dto: UpdateServiceItemDto) {
    const item = await this.items.findOne({ where: { id: id } });
    if (!item) {
      throw new NotFoundException("Item not found");
    }
    if (dto.subcategoryId && dto.subcategoryId !== item.subcategory.id) {
      const subcategory = await this.subcategories.findOne({
        where: { id: dto.subcategoryId },
      });
      if (!subcategory) throw new NotFoundException('Subcategory not found');
      item.subcategory = subcategory;
    }
    if (dto.slug && dto.slug !== item.slug) {
      const existing = await this.items.findOne({
        where: { slug: dto.slug, id: Not(id) },
      });
      if (existing) throw new BadRequestException('Slug already in use');
    }
    if (dto.name !== undefined) {
      item.name = dto.name;
    }
    if (dto.slug !== undefined) {
      item.slug = dto.slug;
    }
    if (dto.description !== undefined) {
      item.description = dto.description;
    }
    if (dto.metadata !== undefined) {
      item.metadata = dto.metadata;
    }
    return this.items.save(item);
  }

  async deleteItem(id: string) {
    const item = await this.items.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Item not found');
    await this.items.remove(item);
    return { success: true };
  }
}
