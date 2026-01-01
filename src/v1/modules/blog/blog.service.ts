import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Blog } from '../../entities/blog.entity';
import { Tag } from '../../entities/tag.entity';
import { User } from '../../entities/user.entity';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';

@Injectable()
export class BlogService {
  constructor(
    @InjectRepository(Blog) private readonly blogs: Repository<Blog>,
    @InjectRepository(Tag) private readonly tags: Repository<Tag>,
  ) {}

  async createBlog(dto: CreateBlogDto, publisher: User): Promise<Blog> {
    const blog = this.blogs.create({
      title: dto.title,
      content: dto.content,
      categories: dto.categories ?? null,
      images: dto.images ?? null,
      videoUrl: dto.videoUrl,
      references: dto.references ?? null,
      comments: (dto.comments as string[] | undefined) ?? null,
      seoTitle: dto.seoTitle,
      seoDescription: dto.seoDescription,
      seoImageUrl: dto.seoImageUrl,
      publishAt: dto.publishAt ? new Date(dto.publishAt) : null,
      isFeatured: dto.isFeatured ?? false,
      isPublished: dto.isPublished ?? true,
    });

    blog.publisher = publisher;

    if (dto.tags?.length) {
      blog.tags = await this.resolveTags(dto.tags);
    }

    return this.blogs.save(blog);
  }

  async updateBlog(
    id: string,
    dto: UpdateBlogDto,
    publisher: User,
  ): Promise<Blog> {
    const blog = await this.blogs.findOne({
      where: { id },
      relations: ['publisher', 'tags'],
    });
    if (!blog) throw new NotFoundException('Blog not found');

    const isAdmin = publisher.role === 'admin';
    if (!isAdmin) {
      if (!blog.publisher || blog.publisher.id !== publisher.id) {
        throw new ForbiddenException('You can only update your own blogs');
      }
    }

    if (dto.title !== undefined) blog.title = dto.title;
    if (dto.content !== undefined) blog.content = dto.content;
    if (dto.categories !== undefined) blog.categories = dto.categories ?? null;
    if (dto.images !== undefined) blog.images = dto.images ?? null;
    if (dto.videoUrl !== undefined) blog.videoUrl = dto.videoUrl;
    if (dto.references !== undefined) blog.references = dto.references ?? null;
    if (dto.comments !== undefined) {
      blog.comments = (dto.comments as string[] | undefined) ?? null;
    }
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
      relations: ['publisher', 'tags'],
    });
    if (!blog) throw new NotFoundException('Blog not found');
    return blog;
  }

  listBlogs(): Promise<Blog[]> {
    return this.blogs.find({
      where: { isPublished: true },
      relations: ['publisher', 'tags'],
      order: { publishAt: 'DESC', createdAt: 'DESC' },
    });
  }

  listBlogsByAuthor(publisher: User): Promise<Blog[]> {
    const where = { publisher: { id: publisher.id } };
    return this.blogs.find({
      where,
      relations: ['publisher', 'tags'],
      order: { publishAt: 'DESC', createdAt: 'DESC' },
    });
  }

  async incrementViews(id: string): Promise<void> {
    await this.blogs.increment({ id }, 'views', 1);
  }

  getFeaturedBlogs(): Promise<Blog[]> {
    return this.blogs.find({
      where: { isPublished: true, isFeatured: true },
      relations: ['publisher', 'tags'],
      order: { publishAt: 'DESC', createdAt: 'DESC' },
      take: 10,
    });
  }

  getTrendingBlogs(): Promise<Blog[]> {
    return this.blogs.find({
      where: { isPublished: true },
      relations: ['publisher', 'tags'],
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
}
