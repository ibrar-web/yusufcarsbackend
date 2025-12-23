import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Tag } from './tag.entity';
import { Supplier } from './supplier.entity';

@Entity('blogs')
export class Blog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 200 })
  title!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'text', array: true, nullable: true })
  categories?: string[] | null;

  @Column({ type: 'text', array: true, nullable: true })
  images?: string[] | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  videoUrl?: string | null;

  @Column({ type: 'text', array: true, nullable: true })
  references?: string[] | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  seoTitle?: string | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  seoDescription?: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  seoImageUrl?: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'author_admin_id' })
  authorAdmin?: User | null;
  @RelationId((blog: Blog) => blog.authorAdmin)
  authorAdminId?: string | null;

  @ManyToOne(() => Supplier, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'author_supplier_id' })
  authorSupplier?: Supplier | null;
  @RelationId((blog: Blog) => blog.authorSupplier)
  authorSupplierId?: string | null;

  @ManyToMany(() => Tag, { eager: true, cascade: false })
  @JoinTable({
    name: 'blog_tags',
    joinColumn: { name: 'blog_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  tags?: Tag[];

  @Column({ type: 'boolean', default: true })
  isPublished!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  publishAt?: Date | null;

  @Column({ type: 'boolean', default: false })
  isFeatured!: boolean;

  @Column({ type: 'int', default: 0 })
  views!: number;

  @Column({ type: 'int', default: 0 })
  likes!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
