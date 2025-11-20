import {
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Messages } from './messages.entity';

@Entity('chats')
export class Chats {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  user: User;

  @ManyToOne(() => User)
  supplier: User;

  @OneToMany(() => Messages, (message) => message.chat)
  messages: Messages[];

  @CreateDateColumn()
  createdAt: Date;
}
