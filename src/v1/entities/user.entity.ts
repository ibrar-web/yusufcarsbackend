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

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;
  @Exclude()
  @Column()
  password!: string;

  @Column()
  fullName!: string;

  @Index()
  @Column({
    type: 'enum',
    enum: ['admin', 'user', 'supplier', 'garage', 'mechanic', 'dealer'],
    default: 'user',
  })
  role!: AppRole;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ type: 'text', nullable: true })
  suspensionReason?: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @Column()
  postCode: string;

  @Index()
  @Column({ type: 'float', nullable: true })
  latitude?: number;

  @Index()
  @Column({ type: 'float', nullable: true })
  longitude?: number;

  @OneToOne(() => Supplier, (supplier) => supplier.user, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  supplier?: Supplier;

  toPublic() {
    const { password, ...rest } = this as any;
    return rest;
  }

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password && !this.password.startsWith('$2')) {
      this.password = await bcrypt.hash(this.password, 12);
    }
  }
}
