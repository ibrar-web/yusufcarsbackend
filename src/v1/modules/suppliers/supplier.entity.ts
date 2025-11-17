import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity('suppliers')
export class Supplier {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn()
  user!: User;

  @Column()
  businessName!: string;

  @Column({ nullable: true })
  tradingAs?: string;

  @Column({ nullable: true })
  businessType?: string;

  @Column({ nullable: true })
  vatNumber?: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  addressLine1?: string;

  @Column({ nullable: true })
  addressLine2?: string;

  @Column({ nullable: true })
  town?: string;

  @Column({ nullable: true })
  county?: string;

  @Index()
  @Column({ nullable: true })
  postCode?: string; // index for matching

  @Column({ nullable: true })
  phone?: string;

  @Index()
  @Column({ type: 'simple-array', nullable: true })
  categories?: string[]; // simple-array, consider array type with PG later

  @Column({ default: false })
  isVerified!: boolean;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ name: 'companyRegistrationDoc', nullable: true })
  companyRegDoc?: string;

  @Column({ name: 'publicLiabilityInsurance', nullable: true })
  insuranceDoc?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
