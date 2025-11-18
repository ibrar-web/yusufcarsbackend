import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Supplier } from '../../../suppliers/supplier.entity';
import { User } from '../../../users/user.entity';
import { QuoteRequest } from '../../../quotes/quote-request.entity';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Supplier, { eager: true, onDelete: 'CASCADE' })
  supplier!: Supplier;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  user!: User;

  @ManyToOne(() => QuoteRequest, { eager: true, onDelete: 'CASCADE' })
  quoteRequest!: QuoteRequest;

  @Column()
  direction!: 'supplier-to-user' | 'user-to-supplier';

  @Column({ type: 'text' })
  body!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
