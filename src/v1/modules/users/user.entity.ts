import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  BeforeInsert,
  BeforeUpdate,
  OneToOne,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Supplier } from '../suppliers/supplier.entity';

export type AppRole = 'admin' | 'user' | 'supplier' | 'garage';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column()
  fullName!: string;

  @Column({
    type: 'enum',
    enum: ['admin', 'user', 'supplier', 'garage'],
    default: 'user',
  })
  role!: AppRole;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @OneToOne(() => Supplier, (supplier) => supplier.user, {
    nullable: true,
    onDelete: 'SET NULL',
  })
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
