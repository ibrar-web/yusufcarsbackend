import {
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Message } from './messages.entity';

@Entity('chats')
export class Chats {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  supplier: User;

  @OneToMany(() => Message, (message) => message.chat)
  messages!: Message[];

  @CreateDateColumn()
  createdAt: Date;
}
