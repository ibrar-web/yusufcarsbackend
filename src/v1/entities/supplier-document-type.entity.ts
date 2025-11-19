import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SupplierDocument } from './supplier-document.entity';

@Entity('supplier_document_types')
@Index(['name'], { unique: true })
export class SupplierDocumentType {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 100, unique: true })
  name!: string;

  @Column({ length: 150 })
  displayName!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => SupplierDocument, (document) => document.documentType, {
    cascade: false,
  })
  documents?: SupplierDocument[];
}
