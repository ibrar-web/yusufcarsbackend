import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  RelationId,
  Index,
} from 'typeorm';
import { Supplier } from '../supplier.entity';
import { QuoteRequest } from './quote-request.entity';
import { Quote } from './quote-offers.entity';
import { User } from '../user.entity';

export enum OrderStatus {
  PENDING_DELIVERY = 'pending_delivery',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('orders')
@Index(['request'], { unique: true })
@Index(['supplier'])
@Index(['buyer'])
@Index(['status'])
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => QuoteRequest, { nullable: false })
  @JoinColumn({ name: 'request_id' })
  request!: QuoteRequest;

  @RelationId((o: Order) => o.request)
  requestId!: string;

  @ManyToOne(() => Supplier, { nullable: false })
  supplier!: Supplier;

  @RelationId((o: Order) => o.supplier)
  supplierId!: string;

  @OneToOne(() => Quote, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'accepted_quote_id' })
  acceptedQuote!: Quote;

  @RelationId((o: Order) => o.acceptedQuote)
  acceptedQuoteId!: string;

  @ManyToOne(() => User, { nullable: false })
  buyer!: User;

  @RelationId((o: Order) => o.buyer)
  buyerId!: string;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING_DELIVERY,
  })
  status!: OrderStatus;

  @Column({ type: 'timestamptz', nullable: true })
  deliveryDate?: Date;

  @Column({ type: 'json', nullable: true })
  trackingInfo?: Record<string, unknown>;

  @Column({ type: 'text', nullable: true })
  cancellationReason?: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
