import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Chats } from './chats.entity';
import { User } from './user.entity';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Chats, (chat) => chat.messages, { onDelete: 'CASCADE' })
  chat!: Chats;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  sender!: User;

  @Column({ type: 'text' })
  content!: string;

  @Column({ default: false })
  isRead!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date | null;
}
