import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import type { UserFavorite as SharedUserFavorite } from '@torchive/shared';

@Entity('user_favorites')
export class UserFavorite implements SharedUserFavorite {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  uid: string;

  @Column()
  work_hash_id: string;

  @CreateDateColumn()
  create_time: Date;
}
