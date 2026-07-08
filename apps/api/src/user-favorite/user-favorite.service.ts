import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UserFavorite } from './entities/user-favorite.entity';
import { CreateUserFavoriteDto } from './dto/create-user-favorite.dto';
import { findByPage } from '@/common/typeorm/find';
import { FindByPageDto } from '@/common/typeorm/find.dto';

@Injectable()
export class UserFavoriteService {
  private readonly logger = new Logger(UserFavoriteService.name);

  constructor(
    @InjectRepository(UserFavorite, 'work-sqlite')
    private readonly favoriteRepository: Repository<UserFavorite>,
  ) {}

  async create(dto: CreateUserFavoriteDto) {
    const existing = await this.favoriteRepository.findOne({
      where: { uid: dto.uid, work_hash_id: dto.work_hash_id },
    });
    if (existing) {
      // 已存在则直接返回已有的（幂等）
      return existing;
    }
    return this.favoriteRepository.save(dto);
  }

  async findByPage(params: FindByPageDto & { uid?: string }) {
    return findByPage({
      ...params,
      repository: this.favoriteRepository,
      alias: 'favorite',
      searchFields: [],
      buildQuery: (qb) => {
        if (params.uid) {
          qb.andWhere('favorite.uid = :uid', { uid: params.uid });
        }
      },
    });
  }

  async remove(id: number) {
    const result = await this.favoriteRepository.delete({ id });
    if (!result.affected || result.affected === 0) {
      throw new NotFoundException(`Favorite<${id}> not found`);
    }
    return { deleted: result.affected };
  }

  async removeByUid(uid: string) {
    const result = await this.favoriteRepository.delete({ uid });
    return { deleted: result.affected || 0 };
  }
}
