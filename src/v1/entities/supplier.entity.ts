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

  @Column({ nullable: true })
  tradingAs?: string;

  @Column({ nullable: true })
  businessType?: string;

  @Column({ nullable: true })
  vatNumber?: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  addressLine1?: string;

  @Column({ nullable: true })
  addressLine2?: string;

  @Column({ nullable: true })
  city?: string;

  @Index()
  @Column({ nullable: true })
  postCode?: string;

  @Column({ nullable: true })
  country?: string;

  @Column({ nullable: true })
  state?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  contactPostcode?: string;

  @Column({ nullable: true })
  serviceRadius?: string;

  @Column({ default: false })
  termsAccepted?: boolean;

  @Column({ default: false })
  gdprConsent?: boolean;

  @Index()
  @Column({ type: 'simple-array', nullable: true })
  categories?: string[];

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
