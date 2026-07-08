import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UserHistory } from './entities/user-history.entity';
import { CreateUserHistoryDto } from './dto/create-user-history.dto';
import { findByPage } from '@/common/typeorm/find';
import { FindByPageDto } from '@/common/typeorm/find.dto';

@Injectable()
export class UserHistoryService {
  private readonly logger = new Logger(UserHistoryService.name);

  constructor(
    @InjectRepository(UserHistory, 'work-sqlite')
    private readonly historyRepository: Repository<UserHistory>,
  ) {}

  async create(dto: CreateUserHistoryDto) {
    // 如果相同 uid + work_hash_id + params 已存在，则更新 update_time
    const existing = await this.historyRepository.findOne({
      where: {
        uid: dto.uid,
        work_hash_id: dto.work_hash_id,
        params: dto.params ?? '',
      },
    });
    if (existing) {
      existing.update_time = new Date();
      return this.historyRepository.save(existing);
    }
    return this.historyRepository.save(dto);
  }

  async findByPage(params: FindByPageDto & { uid?: string }) {
    return findByPage({
      ...params,
      repository: this.historyRepository,
      alias: 'history',
      searchFields: [],
      order: { create_time: 'DESC' },
      buildQuery: (qb) => {
        if (params.uid) {
          qb.andWhere('history.uid = :uid', { uid: params.uid });
        }
      },
    });
  }

  async remove(id: number) {
    const result = await this.historyRepository.delete({ id });
    if (!result.affected || result.affected === 0) {
      throw new NotFoundException(`History<${id}> not found`);
    }
    return { deleted: result.affected };
  }

  async removeByUid(uid: string) {
    const result = await this.historyRepository.delete({ uid });
    return { deleted: result.affected || 0 };
  }
}
