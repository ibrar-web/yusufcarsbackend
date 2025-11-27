import {
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Supplier } from './supplier.entity';
import { Message } from './messages.entity';

@Entity('user_supplier_chats')
export class Chats {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Supplier, { eager: true, onDelete: 'CASCADE' })
  supplier: Supplier;

  @OneToMany(() => Message, (message) => message.chat)
  messages!: Message[];

  @CreateDateColumn()
  createdAt: Date;
}
