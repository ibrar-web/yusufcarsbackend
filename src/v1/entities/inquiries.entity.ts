import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum UrgencyLevel {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
}

@Entity('inquiries')
export class Inquiries {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fullName: string;

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

  @Column()
  fileName: string;

  @Column()
  fileKey: string;

  @Column({ type: 'boolean', default: false })
  contact: boolean;
}
