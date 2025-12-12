import {
  Column,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ServiceCategory } from './service-category.entity';
import { ServiceItem } from './service-item.entity';

@Entity('service_subcategories')
export class ServiceSubcategory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => ServiceCategory, (category) => category.subcategories, {
    onDelete: 'CASCADE',
  })
  category!: ServiceCategory;

  @Index()
  @Column()
  name!: string;

  @Index()
  @Column()
  slug!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'int', default: 0 })
  sortOrder!: number;

  @OneToMany(() => ServiceItem, (item) => item.subcategory, {
    cascade: ['insert', 'update'],
  })
  items!: ServiceItem[];
}
