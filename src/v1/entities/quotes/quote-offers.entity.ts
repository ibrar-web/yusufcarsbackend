import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { QuoteRequest } from './quote-request.entity';
import { Supplier } from '../supplier.entity';

@Entity('quotes_offers')
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

  @Column('numeric')
  price!: number;

  @Column()
  estimatedTime!: string;

  @Column({ nullable: true })
  partCondition?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'timestamp' })
  expiresAt!: Date;

  @Column({
    type: 'enum',
    enum: ['pending', 'accepted', 'expired'],
    default: 'pending',
  })
  status!: 'pending' | 'accepted' | 'expired';

  @CreateDateColumn()
  createdAt!: Date;
}
