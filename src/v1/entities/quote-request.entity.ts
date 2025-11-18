import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Quote } from './quote.entity';

@Entity('quote_requests')
export class QuoteRequest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  user!: User;

  @Column()
  maker!: string;

  @Column()
  model!: string;

  @Column({ nullable: true })
  year?: string;

  @Column({ nullable: true })
  fuelType?: string;

  @Column({ nullable: true })
  engineSize?: string;

  @Column({ type: 'simple-array', nullable: true })
  services?: string[];

  @Column({ nullable: true })
  postcode?: string;

  @Column({ default: false })
  requireFitment!: boolean;

  @Column({ type: 'enum', enum: ['local', 'national'], default: 'local' })
  requestType!: 'local' | 'national';

  @Column({ type: 'enum', enum: ['pending', 'expired', 'completed'], default: 'pending' })
  status!: 'pending' | 'expired' | 'completed';

  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @Column({ nullable: true })
  assignedToInternal?: string;

  @Column({ type: 'text', nullable: true })
  internalNotes?: string;

  @OneToMany(() => Quote, (q) => q.quoteRequest, { cascade: true })
  quotes!: Quote[];

  @CreateDateColumn()
  createdAt!: Date;
}
