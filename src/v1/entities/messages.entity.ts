import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Chats } from './chats.entity';
import { User } from './user.entity';

@Entity('messages')
export class Messages {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Chats, (chat) => chat.messages)
  chat: Chats;

  @ManyToOne(() => User)
  sender: User;

  @Column({ type: 'text' })
  content: string;

  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
