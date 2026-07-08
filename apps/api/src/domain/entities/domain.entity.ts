import { Entity, PrimaryColumn, Column } from 'typeorm';
import type { Domain as SharedDomain } from '@torchive/shared';

@Entity('domains_index')
export class Domain implements SharedDomain {
  @PrimaryColumn()
  domain: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  page_template: string;

  @Column({ default: () => 0 })
  state: number;

  @Column()
  exist: number;
}
