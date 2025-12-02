import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../user.entity';
import { Quote } from './quote-offers.entity';

export enum QuoteRequestStatus {
  PENDING = 'pending',
  EXPIRED = 'expired',
  QUOTED = 'quoted',
  ACCEPTED = 'accepted',
  CONVERTED = 'converted',
}

@Entity('quote_requests')
@Index(['status'])
@Index(['postcode', 'requestType'])
export class QuoteRequest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  user!: User;

  @Column()
  registrationNumber!: string;

  @Column()
  postcode!: string;

  @Column({ nullable: true })
  vin?: string;

  @Column()
  make!: string;

  @Column({ nullable: true })
  model?: string;

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

  @Column({ type: 'boolean', default: false })
  requireFitment!: boolean;

  @Column({ type: 'boolean', default: false })
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

  @Column({ type: 'enum', enum: ['local', 'national'], default: 'local' })
  requestType!: 'local' | 'national';

  @Index()
  @Column({ type: 'float', nullable: true })
  latitude?: number;

  @Index()
  @Column({ type: 'float', nullable: true })
  longitude?: number;

  @Column({
    type: 'enum',
    enum: QuoteRequestStatus,
    default: QuoteRequestStatus.PENDING,
  })
  status!: QuoteRequestStatus;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @OneToMany(() => Quote, (q) => q.quoteRequest, { cascade: true })
  quotes!: Quote[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
