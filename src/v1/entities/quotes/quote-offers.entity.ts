import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { QuoteRequest } from './quote-request.entity';
import { Supplier } from '../supplier.entity';

export enum QuoteStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  EXPIRED = 'expired',
}

@Entity('quotes_offers')
@Index(['quoteRequest', 'supplier'])
@Index(['status'])
export class Quote {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => QuoteRequest, (qr) => qr.quotes, {
    eager: true,
    onDelete: 'CASCADE',
  })
  quoteRequest!: QuoteRequest;

  @ManyToOne(() => Supplier, { eager: true, onDelete: 'CASCADE' })
  supplier!: Supplier;

  @Column()
  partName!: string;

  @Column()
  brand!: string;

  @Column({ type: 'json', nullable: true })
  offers?: Record<string, unknown>; // special offers/promotions

  @Column('numeric')
  price!: number;

  @Column()
  estimatedTime!: string; // delivery estimate

  @Column({ nullable: true })
  partCondition?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'timestamp' })
  expiresAt!: Date; // 45-min quote window enforced in backend

  @Column({ type: 'enum', enum: QuoteStatus, default: QuoteStatus.PENDING })
  status!: QuoteStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
