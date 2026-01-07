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

export enum UserBadgeType {
  FAST_RESPONDER = 'fast_responder',
  TOP_RATED = 'top_rated',
  POWER_SELLER = 'power_seller',
  CUSTOMER_FAVORITE = 'customer_favorite',
  LOYAL_BUYER = 'loyal_buyer',
  COMMUNITY_HELPER = 'community_helper',
}

@Entity('user_badges')
@Index(['user', 'badge'], { unique: true })
export class UserBadge {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, (user) => user.badges, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  user!: User;

  @Column({
    type: 'enum',
    enum: UserBadgeType,
  })
  badge!: UserBadgeType;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, unknown> | null;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt?: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
