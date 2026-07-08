import { Entity, PrimaryColumn, Column, OneToOne } from 'typeorm';
import { Work } from '@/work/entities/work.entity';
import type { WorkDetail as SharedWorkDetail } from '@torchive/shared';

@Entity('work_detail')
export class Detail implements SharedWorkDetail {
  @PrimaryColumn()
  hash_id: string;

  @Column()
  domain: string;

  @Column()
  category: string;

  @Column()
  name: string; // 即 Work.work

  @Column({ nullable: true })
  cover: string;

  @Column({ nullable: true })
  title: string;

  @Column({ nullable: true })
  intro: string;

  @Column()
  amount: number;

  @Column()
  size: number;

  @Column()
  has_section: number;

  @Column()
  is_orphan: number;

  @Column({ default: () => "datetime('now')" })
  create_time: string;

  @Column({ default: () => "datetime('now')" })
  update_time: string;

  @Column('text') // SQLite 的 JSON 存储建议用 text
  entities_json: string;

  // 反向关联 Work
  @OneToOne(() => Work, (work) => work.detail)
  work: Work;
}
