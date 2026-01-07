import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { ServiceCategory } from './services/service-category.entity';
import { ServiceItem } from './services/service-item.entity';

export enum PromotionStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  ACTIVE = 'active',
  EXPIRED = 'expired',
}

export enum DiscountType {
  FLAT = 'flat',
  PERCENTAGE = 'percentage',
}

@Entity('supplier_promotions')
@Index(['supplier'])
@Index(['status'])
@Index(['endsAt'])
export class SupplierPromotion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  supplier!: User;

  @ManyToOne(() => ServiceCategory, {
    nullable: true,
    eager: true,
    onDelete: 'SET NULL',
  })
  targetCategory?: ServiceCategory | null;

  @ManyToOne(() => ServiceItem, {
    nullable: true,
    eager: true,
    onDelete: 'SET NULL',
  })
  targetItem?: ServiceItem | null;

  @Column({ type: 'varchar', length: 150 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({
    type: 'enum',
    enum: DiscountType,
    default: DiscountType.FLAT,
  })
  discountType!: DiscountType;

  @Column({ type: 'numeric' })
  discountValue!: number;

  @Column({ type: 'timestamptz' })
  startsAt!: Date;

  @Column({ type: 'timestamptz' })
  endsAt!: Date;

  @Column({
    type: 'enum',
    enum: PromotionStatus,
    default: PromotionStatus.DRAFT,
  })
  status!: PromotionStatus;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
