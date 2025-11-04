import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  BeforeInsert,
  BeforeUpdate,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import * as bcrypt from 'bcrypt';

export type AppRole = 'admin' | 'customer' | 'supplier' | 'garage';

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

  @Column({ type: 'enum', enum: ['admin', 'customer', 'supplier', 'garage'], default: 'customer' })
  role!: AppRole;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @OneToOne(() => Object, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn()
  supplier?: any;

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


