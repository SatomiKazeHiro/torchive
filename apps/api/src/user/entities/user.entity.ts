import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { User as SharedUser } from '@torchive/shared';

@Entity('users')
export class User implements SharedUser {
  @PrimaryColumn()
  uid: string;

  @Column({ unique: true })
  login_name: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  user_name: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ default: false })
  is_super_admin: boolean;

  @CreateDateColumn()
  create_time: Date;

  @UpdateDateColumn()
  update_time: Date;
}
