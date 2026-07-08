import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import type { UserWatchLater as SharedUserWatchLater } from '@torchive/shared';

@Entity('user_watch_laters')
export class UserWatchLater implements SharedUserWatchLater {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  uid: string;

  @Column()
  work_hash_id: string;

  @CreateDateColumn()
  create_time: Date;
}
