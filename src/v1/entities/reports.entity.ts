import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  RelationId,
  Index,
} from 'typeorm';
import { User } from './user.entity';

export enum ReportStatus {
  OPEN = 'open',
  IN_REVIEW = 'in_review',
  RESOLVED = 'resolved',
  REJECTED = 'rejected',
}

export type ReportSubject =
  | 'user'
  | 'supplier'
  | 'quote_request'
  | 'quote_offer'
  | 'order'
  | 'other';

@Entity('reports')
@Index(['status'])
@Index(['subject'])
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  reporter?: User | null;

  @RelationId((report: Report) => report.reporter)
  reporterId?: string | null;

  @Column({
    type: 'enum',
    enum: [
      'user',
      'supplier',
      'quote_request',
      'quote_offer',
      'order',
      'other',
    ],
    default: 'other',
  })
  subject!: ReportSubject;

  @Column({ type: 'uuid', nullable: true })
  subjectId?: string | null;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'enum', enum: ReportStatus, default: ReportStatus.OPEN })
  status!: ReportStatus;

  @Column({ type: 'text', nullable: true })
  resolutionNotes?: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  assignedAdmin?: User | null;

  @RelationId((report: Report) => report.assignedAdmin)
  assignedAdminId?: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
