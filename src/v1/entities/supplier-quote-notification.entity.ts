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
import { Supplier } from './supplier.entity';
import { QuoteRequest } from './quote-request.entity';

export type SupplierNotificationStatus =
  | 'pending'
  | 'quoted'
  | 'expired'
  | 'accepted'
  | 'rejected';

@Entity('supplier_quote_notifications')
@Index(['supplierId', 'status', 'expiresAt'])
@Index(['requestId'])
@Index(['supplierId'])
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

  /** Distance (for Local requests) */
  @Column({ type: 'float', nullable: true })
  distanceKm?: number;

  /** Metadata about WHY this supplier was matched */
  @Column({ type: 'json', nullable: true })
  matchingDetails?: Record<string, any>;

  /** Pending, quoted, expired, accepted, rejected */
  @Column({
    type: 'enum',
    enum: ['pending', 'quoted', 'expired', 'accepted', 'rejected'],
    default: 'pending',
  })
  status!: SupplierNotificationStatus;

  /** The moment this supplier’s quoting window closes */
  @Column({ type: 'timestamptz', nullable: false })
  expiresAt!: Date;

  /** Optional ranking score for future priority algorithm */
  @Column({ type: 'float', nullable: true })
  priorityScore?: number;

  /** Timestamp when supplier submitted a quote */
  @Column({ type: 'timestamptz', nullable: true })
  quotedAt?: Date;

  /** Reason if rejected */
  @Column({ type: 'text', nullable: true })
  rejectionReason?: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
