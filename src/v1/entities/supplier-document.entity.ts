import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Supplier } from './supplier.entity';

export type SupplierDocumentType = 'companyReg' | 'insurance';

@Entity('supplier_documents')
export class SupplierDocument {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Supplier, (supplier) => supplier.documents, {
    onDelete: 'CASCADE',
    eager: true,
  })
  supplier!: Supplier;

  @Column({
    type: 'enum',
    enum: ['companyReg', 'insurance'],
  })
  type!: SupplierDocumentType;

  @Column()
  s3Key!: string;

  @Column()
  url!: string;

  @Column()
  originalName!: string;

  @Column({ nullable: true })
  mimeType?: string;

  @Column({ type: 'bigint', nullable: true })
  size?: number;

  @CreateDateColumn()
  createdAt!: Date;
}
