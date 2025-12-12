import {
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ServiceSubcategory } from './service-subcategory.entity';

@Entity('service_items')
export class ServiceItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => ServiceSubcategory, (subcategory) => subcategory.items, {
    onDelete: 'CASCADE',
  })
  subcategory!: ServiceSubcategory;

  @Index()
  @Column()
  name!: string;

  @Index()
  @Column({ unique: true })
  slug!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;
}
