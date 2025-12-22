import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum UrgencyLevel {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
}

export enum InquiryStatus {
  PENDING = 'pending',
  EXPIRED = 'expired',
  COMPLETED = 'completed',
}

@Entity('inquiries')
export class Inquiries {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column()
  email: string;

  @Column()
  subject: string;

  @Column({
    type: 'enum',
    enum: UrgencyLevel,
    default: UrgencyLevel.NORMAL,
  })
  urgency: UrgencyLevel;

  @Column({ type: 'text' })
  content: string;

  @Column({ nullable: true })
  fileName?: string;

  @Column({ nullable: true })
  fileKey?: string;

  @Column({ type: 'boolean', default: false })
  contact: boolean;

  @Column({
    type: 'enum',
    enum: InquiryStatus,
    default: InquiryStatus.PENDING,
  })
  status: InquiryStatus;

  @CreateDateColumn()
  createdAt: Date;
}
