import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Index,
} from 'typeorm';
import { ServiceSubcategory } from './service-subcategory.entity';

@Entity('service_categories')
export class ServiceCategory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ unique: true })
  name!: string;

  @Index()
  @Column({ unique: true })
  slug!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', nullable: true })
  imageKey?: string | null;

  @Column({ type: 'text', nullable: true })
  imageUrl?: string | null;

  @Column({ type: 'int', default: 0 })
  sortOrder!: number;

  @OneToMany(() => ServiceSubcategory, (sub) => sub.category, {
    cascade: ['insert', 'update'],
  })
  subcategories!: ServiceSubcategory[];
}
