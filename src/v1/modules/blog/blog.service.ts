import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Blog } from '../../entities/blog.entity';
import { Tag } from '../../entities/tag.entity';
import { Supplier } from '../../entities/supplier.entity';
import { User } from '../../entities/user.entity';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';

@Injectable()
export class BlogService {
  constructor(
    @InjectRepository(Blog) private readonly blogs: Repository<Blog>,
    @InjectRepository(Tag) private readonly tags: Repository<Tag>,
  ) {}

  async createBlog(dto: CreateBlogDto, author: User | Supplier): Promise<Blog> {
    const blog = this.blogs.create({
      title: dto.title,
      content: dto.content,
      categories: dto.categories ?? null,
      images: dto.images ?? null,
      videoUrl: dto.videoUrl,
      references: dto.references ?? null,
      seoTitle: dto.seoTitle,
      seoDescription: dto.seoDescription,
      seoImageUrl: dto.seoImageUrl,
      publishAt: dto.publishAt ? new Date(dto.publishAt) : null,
      isFeatured: dto.isFeatured ?? false,
      isPublished: dto.isPublished ?? true,
    });

    const supplierAuthor = this.asSupplier(author);
    if (supplierAuthor) {
      blog.authorSupplier = supplierAuthor;
    } else {
      const adminAuthor = author as User;
      blog.authorAdmin = adminAuthor;
    }

    if (dto.tags?.length) {
      blog.tags = await this.resolveTags(dto.tags);
    }

    return this.blogs.save(blog);
  }

  async updateBlog(
    id: string,
    dto: UpdateBlogDto,
    author: User | Supplier,
  ): Promise<Blog> {
    const blog = await this.blogs.findOne({
      where: { id },
      relations: ['authorAdmin', 'authorSupplier', 'tags'],
    });
    if (!blog) throw new NotFoundException('Blog not found');

    const supplierAuthor = this.asSupplier(author);
    if (supplierAuthor) {
      if (
        !blog.authorSupplier ||
        blog.authorSupplier.id !== supplierAuthor.id
      ) {
        throw new ForbiddenException('You can only update your own blogs');
      }
    } else {
      const adminAuthor = author as User;
      if (
        adminAuthor.role !== 'admin' &&
        (!blog.authorAdmin || blog.authorAdmin.id !== adminAuthor.id)
      ) {
        throw new ForbiddenException('You can only update your own blogs');
      }
    }

    if (dto.title !== undefined) blog.title = dto.title;
    if (dto.content !== undefined) blog.content = dto.content;
    if (dto.categories !== undefined) blog.categories = dto.categories ?? null;
    if (dto.images !== undefined) blog.images = dto.images ?? null;
    if (dto.videoUrl !== undefined) blog.videoUrl = dto.videoUrl;
    if (dto.references !== undefined) blog.references = dto.references ?? null;
    if (dto.seoTitle !== undefined) blog.seoTitle = dto.seoTitle;
    if (dto.seoDescription !== undefined)
      blog.seoDescription = dto.seoDescription;
    if (dto.seoImageUrl !== undefined) blog.seoImageUrl = dto.seoImageUrl;
    if (dto.publishAt !== undefined) {
      blog.publishAt = dto.publishAt ? new Date(dto.publishAt) : null;
    }
    if (dto.isFeatured !== undefined) blog.isFeatured = dto.isFeatured;
    if (dto.isPublished !== undefined) blog.isPublished = dto.isPublished;

    if (dto.tags) {
      blog.tags = await this.resolveTags(dto.tags);
    }

    return this.blogs.save(blog);
  }

  async deleteBlog(id: string, author: User): Promise<void> {
    if (author.role !== 'admin') {
      throw new ForbiddenException('Only admins can delete blogs');
    }
    const blog = await this.blogs.findOne({ where: { id } });
    if (!blog) throw new NotFoundException('Blog not found');
    await this.blogs.remove(blog);
  }

  async getBlog(id: string): Promise<Blog> {
    const blog = await this.blogs.findOne({
      where: { id },
      relations: ['authorAdmin', 'authorSupplier', 'tags'],
    });
    if (!blog) throw new NotFoundException('Blog not found');
    return blog;
  }

  listBlogs(): Promise<Blog[]> {
    return this.blogs.find({
      where: { isPublished: true },
      relations: ['authorAdmin', 'authorSupplier', 'tags'],
      order: { publishAt: 'DESC', createdAt: 'DESC' },
    });
  }

  listBlogsByAuthor(author: User | Supplier): Promise<Blog[]> {
    const supplierAuthor = this.asSupplier(author);
    const where = supplierAuthor
      ? { authorSupplier: { id: supplierAuthor.id } }
      : { authorAdmin: { id: (author as User).id } };
    return this.blogs.find({
      where,
      relations: ['authorAdmin', 'authorSupplier', 'tags'],
      order: { publishAt: 'DESC', createdAt: 'DESC' },
    });
  }

  private isSupplier(author: User | Supplier): author is Supplier {
    return author instanceof Supplier;
  }

  async incrementViews(id: string): Promise<void> {
    await this.blogs.increment({ id }, 'views', 1);
  }

  getFeaturedBlogs(): Promise<Blog[]> {
    return this.blogs.find({
      where: { isPublished: true, isFeatured: true },
      relations: ['authorAdmin', 'authorSupplier', 'tags'],
      order: { publishAt: 'DESC', createdAt: 'DESC' },
      take: 10,
    });
  }

  getTrendingBlogs(): Promise<Blog[]> {
    return this.blogs.find({
      where: { isPublished: true },
      relations: ['authorAdmin', 'authorSupplier', 'tags'],
      order: { views: 'DESC', likes: 'DESC' },
      take: 10,
    });
  }

  private async resolveTags(names: string[]): Promise<Tag[]> {
    if (!names.length) return [];
    const normalized = names.map((name) => name.trim()).filter(Boolean);
    if (!normalized.length) return [];

    const existing = await this.tags.find({
      where: { name: In(normalized) },
    });
    const existingNames = new Set(existing.map((tag) => tag.name));

    const newNames = normalized.filter((name) => !existingNames.has(name));
    const newTags =
      newNames.length > 0
        ? this.tags.create(newNames.map((name) => ({ name })))
        : [];

    if (newTags.length) {
      await this.tags.save(newTags);
    }

    return [...existing, ...newTags];
  }

  private asSupplier(author: User | Supplier): Supplier | undefined {
    if (
      author &&
      typeof author === 'object' &&
      'businessName' in author &&
      'user' in author
    ) {
      return author as Supplier;
    }
    return undefined;
  }
}
