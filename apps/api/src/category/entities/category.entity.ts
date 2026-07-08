import { Entity, PrimaryColumn, Column } from 'typeorm';
import type { Category as SharedCategory } from '@torchive/shared';

@Entity('categories_index')
export class Category implements SharedCategory {
  @PrimaryColumn()
  hash_id: string;

  @Column()
  category: string;

  @Column()
  name: string;

  @Column()
  domain: string;

  @Column({ nullable: true })
  page_template: string;

  @Column({ nullable: true })
  work_page_template: string;

  @Column({ default: () => 0 })
  state: number;

  @Column()
  exist: number;
}
