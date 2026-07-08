import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UserWatchLater } from './entities/user-watch-later.entity';
import { CreateUserWatchLaterDto } from './dto/create-user-watch-later.dto';
import { findByPage } from '@/common/typeorm/find';
import { FindByPageDto } from '@/common/typeorm/find.dto';

@Injectable()
export class UserWatchLaterService {
  private readonly logger = new Logger(UserWatchLaterService.name);

  constructor(
    @InjectRepository(UserWatchLater, 'work-sqlite')
    private readonly watchLaterRepository: Repository<UserWatchLater>,
  ) {}

  async create(dto: CreateUserWatchLaterDto) {
    const existing = await this.watchLaterRepository.findOne({
      where: { uid: dto.uid, work_hash_id: dto.work_hash_id },
    });
    if (existing) {
      return existing;
    }
    return this.watchLaterRepository.save(dto);
  }

  async findByPage(params: FindByPageDto & { uid?: string }) {
    return findByPage({
      ...params,
      repository: this.watchLaterRepository,
      alias: 'watchLater',
      searchFields: [],
      buildQuery: (qb) => {
        if (params.uid) {
          qb.andWhere('watchLater.uid = :uid', { uid: params.uid });
        }
      },
    });
  }

  async remove(id: number) {
    const result = await this.watchLaterRepository.delete({ id });
    if (!result.affected || result.affected === 0) {
      throw new NotFoundException(`WatchLater<${id}> not found`);
    }
    return { deleted: result.affected };
  }

  async removeByUid(uid: string) {
    const result = await this.watchLaterRepository.delete({ uid });
    return { deleted: result.affected || 0 };
  }
}
