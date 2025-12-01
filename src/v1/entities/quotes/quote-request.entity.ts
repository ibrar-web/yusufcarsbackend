import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../user.entity';
import { Quote } from './quote-offers.entity';

@Entity('quote_requests')
export class QuoteRequest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  user!: User;

  @Column({ nullable: true })
  model?: string;

  @Column()
  make!: string;

  @Column({ nullable: true })
  registrationNumber?: string;

  @Column({ nullable: true })
  taxStatus?: string;

  @Column({ nullable: true })
  taxDueDate?: string;

  @Column({ nullable: true })
  motStatus?: string;

  @Column({ nullable: true })
  yearOfManufacture?: string;

  @Column({ nullable: true })
  fuelType?: string;

  @Column({ nullable: true })
  engineSize?: string;

  @Column({ type: 'int', nullable: true })
  engineCapacity?: number;

  @Column({ type: 'int', nullable: true })
  co2Emissions?: number;

  @Column({ type: 'boolean', nullable: true })
  markedForExport?: boolean;

  @Column({ nullable: true })
  colour?: string;

  @Column({ nullable: true })
  typeApproval?: string;

  @Column({ type: 'int', nullable: true })
  revenueWeight?: number;

  @Column({ nullable: true })
  dateOfLastV5CIssued?: string;

  @Column({ nullable: true })
  motExpiryDate?: string;

  @Column({ nullable: true })
  wheelplan?: string;

  @Column({ nullable: true })
  monthOfFirstRegistration?: string;

  @Column({ type: 'simple-array', nullable: true })
  services?: string[];

  @Column({ nullable: true })
  postcode?: string;

  @Column({ type: 'enum', enum: ['local', 'national'], default: 'local' })
  requestType!: 'local' | 'national';

  @Column({
    type: 'enum',
    enum: ['pending', 'expired'],
    default: 'pending',
  })
  status!: 'pending' | 'expired';

  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @OneToMany(() => Quote, (q) => q.quoteRequest, { cascade: true })
  quotes!: Quote[];

  @CreateDateColumn()
  createdAt!: Date;
}
