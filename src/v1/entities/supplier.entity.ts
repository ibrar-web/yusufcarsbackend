import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { SupplierDocument } from './supplier-document.entity';

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
  city?: string;

  @Index()
  @Column({ nullable: true })
  postCode?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  contactPostcode?: string;

  @Column({ nullable: true })
  serviceRadius?: string;

  @Column({ default: false })
  termsAccepted?: boolean;

  @Column({ default: false })
  gdprConsent?: boolean;

  @Index()
  @Column({ type: 'simple-array', nullable: true })
  categories?: string[];

  @Column({ default: false })
  isVerified!: boolean;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @OneToMany(() => SupplierDocument, (document) => document.supplier)
  documents?: SupplierDocument[];
}
