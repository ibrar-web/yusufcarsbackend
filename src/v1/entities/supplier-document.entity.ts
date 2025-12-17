import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
  Unique,
} from 'typeorm';
import { Supplier } from './supplier.entity';
import { SupplierDocumentType } from './supplier-document-type.entity';

@Entity('supplier_documents')
@Unique('UQ_supplier_document_per_type', ['supplier', 'documentType'])
export class SupplierDocument {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Supplier, (supplier) => supplier.documents, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'supplier_id' })
  supplier!: Supplier;
  @RelationId((doc: SupplierDocument) => doc.supplier)
  supplierId!: string;

  @ManyToOne(() => SupplierDocumentType, (type) => type.documents, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'document_type_id' })
  documentType!: SupplierDocumentType;
  @RelationId((doc: SupplierDocument) => doc.documentType)
  documentTypeId!: string;

  @Column({ length: 255 })
  s3Key!: string;

  @Column({ length: 255 })
  originalName!: string;

  @Column({ length: 150, nullable: true })
  mimeType?: string;

  @Column({ type: 'bigint', nullable: true })
  size?: number;

  @CreateDateColumn()
  createdAt!: Date;
}
