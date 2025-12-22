import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  BeforeInsert,
  BeforeUpdate,
  OneToOne,
  Index,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Supplier } from './supplier.entity';
import { Exclude } from 'class-transformer';

export type AppRole =
  | 'admin'
  | 'user'
  | 'supplier'
  | 'garage'
  | 'mechanic'
  | 'dealer';

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  DELETED = 'deleted',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Exclude()
  @Column()
  password!: string;

  @Column({ type: 'varchar', nullable: true, default: '' })
  firstName?: string;

  @Column({ type: 'varchar', nullable: true, default: '' })
  lastName?: string;

  @Index()
  @Column({
    type: 'enum',
    enum: ['admin', 'user', 'supplier', 'garage', 'mechanic', 'dealer'],
    default: 'user',
  })
  role!: AppRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status!: UserStatus;

  @Column({ type: 'text', nullable: true })
  suspensionReason?: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @Column()
  postCode: string;

  @Index()
  @Column({ type: 'float' })
  latitude?: number;

  @Index()
  @Column({ type: 'float' })
  longitude?: number;

  @OneToOne(() => Supplier, (supplier) => supplier.user, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  supplier?: Supplier;

  toPublic(): Omit<User, 'password'> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...rest } = this;
    return { ...rest } as Omit<User, 'password'>;
  }

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password && !this.password.startsWith('$2')) {
      this.password = await bcrypt.hash(this.password, 12);
    }
  }
}
