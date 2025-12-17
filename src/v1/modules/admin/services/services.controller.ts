import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminServicesService } from './services.service';
import { JwtCookieGuard } from '../guards/jwt-cookie.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CreateServiceSubcategoryDto } from './dto/create-service-subcategory.dto';
import { UpdateServiceSubcategoryDto } from './dto/update-service-subcategory.dto';
import { CreateServiceItemDto } from './dto/create-service-item.dto';
import { UpdateServiceItemDto } from './dto/update-service-item.dto';
import { CreateServiceCategoryDto } from './dto/create-service-category.dto';
import { UpdateServiceCategoryDto } from './dto/update-service-category.dto';

@Controller('admin/services')
@UseGuards(JwtCookieGuard, RolesGuard)
@Roles('admin')
export class AdminServicesController {
  constructor(private readonly servicesService: AdminServicesService) {}

  @Get('categories')
  listCategories() {
    return this.servicesService.listCategories();
  }

  @Get('categories/:id')
  getCategory(@Param('id') id: string) {
    return this.servicesService.getCategory(id);
  }

  @Post('categories')
  createCategory(@Body() dto: CreateServiceCategoryDto) {
    return this.servicesService.createCategory(dto);
  }

  @Patch('categories/:id')
  updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateServiceCategoryDto,
  ) {
    return this.servicesService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  deleteCategory(@Param('id') id: string) {
    return this.servicesService.deleteCategory(id);
  }

  @Get('subcategories')
  listSubcategories(@Query('categoryId') categoryId?: string) {
    return this.servicesService.listSubcategories(categoryId);
  }

  @Get('subcategories/:id')
  getSubcategory(@Param('id') id: string) {
    return this.servicesService.getSubcategory(id);
  }

  @Post('categories/:categoryId/subcategories')
  createSubcategory(
    @Param('categoryId') categoryId: string,
    @Body() dto: CreateServiceSubcategoryDto,
  ) {
    return this.servicesService.createSubcategory(categoryId, dto);
  }

  @Patch('subcategories/:id')
  updateSubcategory(
    @Param('id') id: string,
    @Body() dto: UpdateServiceSubcategoryDto,
  ) {
    return this.servicesService.updateSubcategory(id, dto);
  }

  @Delete('subcategories/:id')
  deleteSubcategory(@Param('id') id: string) {
    return this.servicesService.deleteSubcategory(id);
  }

  @Get('items')
  listItems(@Query('subcategoryId') subcategoryId?: string) {
    return this.servicesService.listItems(subcategoryId);
  }

  @Get('items/:id')
  getItem(@Param('id') id: string) {
    return this.servicesService.getItem(id);
  }

  @Post('subcategories/:subcategoryId/items')
  createItem(
    @Param('subcategoryId') subcategoryId: string,
    @Body() dto: CreateServiceItemDto,
  ) {
    return this.servicesService.createItem(subcategoryId, dto);
  }

  @Patch('items/:id')
  updateItem(@Param('id') id: string, @Body() dto: UpdateServiceItemDto) {
    return this.servicesService.updateItem(id, dto);
  }

  @Delete('items/:id')
  deleteItem(@Param('id') id: string) {
    return this.servicesService.deleteItem(id);
  }
}
