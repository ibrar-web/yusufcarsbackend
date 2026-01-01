import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { BlogService } from './blog.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../admin/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { Supplier } from '../../entities/supplier.entity';

@Controller('blogs')
export class BlogController {
  constructor(
    private readonly blogs: BlogService,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Supplier)
    private readonly suppliers: Repository<Supplier>,
  ) {}

  @Get()
  list() {
    return this.blogs.listBlogs();
  }

  @Get('featured')
  featured() {
    return this.blogs.getFeaturedBlogs();
  }

  @Get('trending')
  trending() {
    return this.blogs.getTrendingBlogs();
  }

  @Get('mine')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin', 'supplier')
  async myBlogs(@CurrentUser() user: AuthenticatedUser) {
    const publisher = await this.resolvePublisher(user);
    return this.blogs.listBlogsByAuthor(publisher);
  }

  @Get(':id')
  async detail(@Param('id') id: string) {
    const blog = await this.blogs.getBlog(id);
    await this.blogs.incrementViews(id);
    return blog;
  }

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin', 'supplier')
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateBlogDto,
  ) {
    const publisher = await this.resolvePublisher(user);
    return this.blogs.createBlog(dto, publisher);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin', 'supplier')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateBlogDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const publisher = await this.resolvePublisher(user);
    return this.blogs.updateBlog(id, dto, publisher);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const admin = await this.users.findOne({ where: { id: user.sub } });
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }
    await this.blogs.deleteBlog(id, admin);
    return { deleted: true };
  }

  private async resolvePublisher(user: AuthenticatedUser): Promise<User> {
    if (user.role === 'supplier') {
      const supplier = await this.suppliers.findOne({
        where: { user: { id: user.sub } },
        relations: ['user'],
      });
      if (!supplier) {
        throw new NotFoundException('Supplier profile not found');
      }
      if (!supplier.user) {
        throw new NotFoundException('Supplier user not found');
      }
      return supplier.user;
    }
    const admin = await this.users.findOne({ where: { id: user.sub } });
    if (!admin) {
      throw new NotFoundException('User not found');
    }
    return admin;
  }
}
