import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('inquries')
export class Inquries {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  message: string;

  
}
