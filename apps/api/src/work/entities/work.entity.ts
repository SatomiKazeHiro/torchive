import {
  Entity,
  PrimaryColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Detail } from '@/detail/entities/detail.entity';
import type { Work as SharedWork } from '@torchive/shared';

@Entity('works_index')
export class Work implements SharedWork {
  @PrimaryColumn()
  hash_id: string;

  @Column()
  path: string;

  @Column()
  work: string;

  @Column()
  domain: string;

  @Column()
  category: string;

  @CreateDateColumn()
  create_time: Date;

  @Column({ default: () => 0 })
  state: number;

  @Column()
  exist: number;

  // 关联 Detail
  @OneToOne(() => Detail, (detail) => detail.work, { eager: false })
  @JoinColumn({ name: 'hash_id', referencedColumnName: 'hash_id' })
  detail: Detail;
}
