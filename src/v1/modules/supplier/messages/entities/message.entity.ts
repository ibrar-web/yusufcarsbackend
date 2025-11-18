import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Supplier } from '../../../../entities/supplier.entity';
import { User } from '../../../../entities/user.entity';
import { QuoteRequest } from '../../../../entities/quote-request.entity';

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
