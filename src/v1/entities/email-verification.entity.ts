import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
} from 'typeorm';
import { User } from './user.entity';

@Entity('email_verifications')
@Index(['user', 'code'])
export class EmailVerification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user!: User;

  @RelationId((verification: EmailVerification) => verification.user)
  userId!: string;

  @Column({ type: 'varchar', length: 6 })
  code!: string;

  @Column({ type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ type: 'int', default: 0 })
  attempts!: number;

  @Column({ type: 'boolean', default: false })
  consumed!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  verifiedAt?: Date | null;
}
