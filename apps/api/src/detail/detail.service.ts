import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, EntityManager } from 'typeorm';

import { Detail } from './entities/detail.entity';
import { CreateDetailDto } from './dto/create-detail.dto';
import { UpdateDetailDto, Field } from './dto/update-detail.dto';

import { createIfNotExists } from '@/common/typeorm/create';
import { updateOneIfExists } from '@/common/typeorm/update';
import { removeIfExists } from '@/common/typeorm/remove';
import { initManyIfNotExists } from '@/common/typeorm/init-many';
import { findByPage } from '@/common/typeorm/find';
import { FindByPageDto } from '@/common/typeorm/find.dto';

@Injectable()
export class DetailService {
  private readonly logger = new Logger(DetailService.name);

  constructor(
    @InjectRepository(Detail, 'work-sqlite')
    private readonly detailRepository: Repository<Detail>,

    @InjectDataSource('work-sqlite')
    private readonly dataSource: DataSource, // 注入 DataSource 来手动开启事务
  ) {}

  async create(createDetailDto: CreateDetailDto) {
    return await createIfNotExists({
      repository: this.detailRepository,
      dto: createDetailDto,
      uniqueKey: 'hash_id',
      errorMessage: `Detail<${createDetailDto.hash_id}> has exist`,
    });
  }

  async findAll() {
    return await this.detailRepository.find();
  }

  async findOne(hash_id: string) {
    return await this.detailRepository.findOne({
      where: { hash_id },
    });
  }

  async findByPage(params: FindByPageDto<Detail>) {
    return findByPage({
      ...params,
      repository: this.detailRepository,
      alias: 'detail',
      searchFields: ['name', 'title'],
    });
  }

  async update(
    hash_id: string,
    updateDetailDto: UpdateDetailDto,
  ): Promise<Detail> {
    const fields: Field[] = [
      // 'hash_id',
      // 'name',
      // 'domain',
      // 'category',
      'cover',
      'title',
      'intro',
      'amount',
      'size',
      'has_section',
      'is_orphan',
      'create_time',
      'update_time',
      'entities_json',
    ];
    return await updateOneIfExists({
      repository: this.detailRepository,
      dto: updateDetailDto,
      uniqueKey: 'hash_id',
      uniqueValue: hash_id,
      updateFields: fields,
    });
  }

  async remove(
    hash_id: string | string[],
    options?: { safe?: boolean }, // safe=true 时走 remove
  ) {
    return await removeIfExists({
      dataSource: this.dataSource,
      repository: this.detailRepository,
      uniqueKey: 'hash_id',
      values: hash_id,
      mode: options?.safe ? 'safe' : 'fast', // 默认 fast
      logger: this.logger,
    });
  }

  async initMany(
    detailCreateDtos: Partial<Detail>[],
    manager: EntityManager,
  ): Promise<Detail[]> {
    const updateFields: Field[] = [
      // 'cover',
      // 'title',
      // 'intro',
      'amount',
      'size',
      'cover',
      'has_section',
      'is_orphan',
      // 'create_time',
      'update_time',
      'entities_json',
    ];

    return initManyIfNotExists({
      repository: manager.getRepository(Detail),
      dtos: detailCreateDtos,
      uniqueKey: 'hash_id',
      updateFields: updateFields,
    });
  }
}
