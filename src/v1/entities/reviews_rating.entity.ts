import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  RelationId,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Order } from './quotes/order.entity';

@Entity('reviews_ratings')
@Index(['rating'])
@Index(['order', 'user'], { unique: true })
export class ReviewRating {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  user!: User;

  @RelationId((review: ReviewRating) => review.user)
  userId!: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  supplier!: User;

  @RelationId((review: ReviewRating) => review.supplier)
  supplierId!: string;

  @ManyToOne(() => Order, { nullable: true, onDelete: 'SET NULL' })
  order?: Order | null;

  @RelationId((review: ReviewRating) => review.order)
  orderId?: string | null;

  @Column({ type: 'int', default: 0 })
  rating!: number;

  @Column({ type: 'text', nullable: true })
  comment?: string | null;

  @Column({ type: 'boolean', default: false })
  isFlagged!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
