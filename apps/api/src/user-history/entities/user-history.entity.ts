import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { UserHistory as SharedUserHistory } from '@torchive/shared';

@Entity('user_histories')
export class UserHistory implements SharedUserHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  uid: string;

  @Column()
  work_hash_id: string;

  @Column({ type: 'text', nullable: true })
  params: string;

  @CreateDateColumn()
  create_time: Date;

  @UpdateDateColumn()
  update_time: Date;
}
