import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  RelationId,
  Index,
} from 'typeorm';
import { Supplier } from '../supplier.entity';
import { QuoteRequest } from './quote-request.entity';

export enum SupplierNotificationStatus {
  PENDING = 'pending',
  QUOTED = 'quoted',
  EXPIRED = 'expired',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

@Entity('supplier_quote_notifications')
@Index(['supplierId', 'requestId'], { unique: true })
@Index(['supplierId'])
@Index(['requestId'])
@Index(['status'])
export class SupplierQuoteNotification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Supplier, { nullable: false, onDelete: 'CASCADE' })
  supplier!: Supplier;

  @RelationId((n: SupplierQuoteNotification) => n.supplier)
  supplierId!: string;

  @ManyToOne(() => QuoteRequest, { nullable: false, onDelete: 'CASCADE' })
  request!: QuoteRequest;

  @RelationId((n: SupplierQuoteNotification) => n.request)
  requestId!: string;

  @Column({ type: 'float', nullable: true })
  distanceKm?: number;

  @Column({ type: 'json', nullable: true })
  matchingDetails?: Record<string, unknown>;

  @Column({
    type: 'enum',
    enum: SupplierNotificationStatus,
    default: SupplierNotificationStatus.PENDING,
  })
  status!: SupplierNotificationStatus;

  @Index()
  @Column({ type: 'timestamptz', nullable: false })
  expiresAt!: Date;

  @Column({ type: 'float', nullable: true })
  priorityScore?: number;

  @Column({ type: 'timestamptz', nullable: true })
  quotedAt?: Date;

  @Column({ type: 'text', nullable: true })
  rejectionReason?: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
