import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  RelationId,
  Index,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Supplier } from '../supplier.entity';
import { QuoteRequest } from './quote-request.entity';
import { Quote } from './quote-offers.entity';

export type OrderStatus =
  | 'pending_delivery'
  | 'in_transit'
  | 'delivered'
  | 'completed'
  | 'cancelled';

@Entity('orders')
@Index(['supplierId'])
@Index(['buyerId'])
@Index(['status'])
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => QuoteRequest, { nullable: false })
  @JoinColumn({ name: 'request_id' })
  request!: QuoteRequest;

  @RelationId((o: Order) => o.request)
  @Index({ unique: true })
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

  @Column({ type: 'uuid', nullable: false })
  buyerId!: string;

  @Column({
    type: 'enum',
    enum: [
      'pending_delivery',
      'in_transit',
      'delivered',
      'completed',
      'cancelled',
    ],
    default: 'pending_delivery',
  })
  status!: OrderStatus;

  @Column({ type: 'timestamptz', nullable: true })
  deliveryDate?: Date;

  @Column({ type: 'json', nullable: true })
  trackingInfo?: any;

  @Column({ type: 'text', nullable: true })
  cancellationReason?: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
