import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
  OneToMany,
  UpdateDateColumn,
  RelationId,
} from 'typeorm';
import { User } from './user.entity';
import { SupplierDocument } from './supplier-document.entity';

export enum SupplierApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  NEEDS_MORE_INFORMATION = 'needs_more_information',
}

@Entity('suppliers')
@Index(['approvalStatus'])
@Index(['postCode'])
export class Supplier {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
  @RelationId((supplier: Supplier) => supplier.user)
  userId!: string;

  @Column()
  businessName!: string;

  @Column()
  tradingAs!: string;

  @Column()
  businessType!: string;

  @Column()
  vatNumber!: string;

  @Column()
  description!: string;

  @Column()
  addressLine1!: string;

  @Column({ nullable: true })
  addressLine2?: string;

  @Column()
  city!: string;

  @Column()
  postCode!: string;

  @Column({ nullable: true })
  country?: string;

  @Column({ nullable: true })
  state?: string;

  @Column()
  phone!: string;

  @Column({ type: 'text', nullable: true })
  mainCategoryImageKey?: string | null;

  @Column({ type: 'text', nullable: true })
  mainCategoryImageUrl?: string | null;

  @Column()
  termsAccepted!: boolean;

  @Column()
  gdprConsent!: boolean;

  @Column({
    type: 'enum',
    enum: SupplierApprovalStatus,
    default: SupplierApprovalStatus.PENDING,
  })
  approvalStatus!: SupplierApprovalStatus;

  @Column({ type: 'text', nullable: true })
  rejectionReason?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  approvedAt?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  submittedAt?: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => SupplierDocument, (document) => document.supplier)
  documents?: SupplierDocument[];
}
