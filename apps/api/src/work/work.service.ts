import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository, EntityManager } from 'typeorm';

import { Work } from './entities/work.entity';
import { CreateWorkDto } from './dto/create-work.dto';
import { UpdateWorkDto, Field } from './dto/update-work.dto';

import { createIfNotExists } from '@/common/typeorm/create';
import { updateOneIfExists } from '@/common/typeorm/update';
import { removeIfExists } from '@/common/typeorm/remove';
import { initManyIfNotExists } from '@/common/typeorm/init-many';
import { findByPage } from '@/common/typeorm/find';
import { FindWorkByPageDto } from '@/common/typeorm/find.work.dto';

@Injectable()
export class WorkService {
  private readonly logger = new Logger(WorkService.name);

  constructor(
    @InjectRepository(Work, 'work-sqlite')
    private readonly workRepository: Repository<Work>,

    @InjectDataSource('work-sqlite')
    private readonly dataSource: DataSource, // 注入 DataSource 来手动开启事务
  ) {}

  async create(createWorkDto: CreateWorkDto) {
    return await createIfNotExists({
      repository: this.workRepository,
      dto: createWorkDto,
      uniqueKey: 'hash_id',
      errorMessage: `Work<${createWorkDto.hash_id}> has exist`,
    });
  }

  async findAll() {
    return await this.workRepository.find();
  }

  async findOne(hash_id: string) {
    return await this.workRepository.findOne({
      where: { hash_id },
      relations: ['detail'],
    });
  }

  async findByPage(params: FindWorkByPageDto) {
    // 处理排序字段映射：detail 表的字段需要加前缀
    const detailFields = [
      'create_time',
      'update_time',
      'title',
      'cover',
      'intro',
      'has_section',
      'is_orphan',
      'size',
      'amount',
    ];
    const order = params.order
      ? Object.fromEntries(
          Object.entries(params.order).map(([key, value]) => [
            detailFields.includes(key) ? `detail.${key}` : key,
            value,
          ]),
        )
      : undefined;

    return findByPage({
      ...params,
      order,
      repository: this.workRepository,
      alias: 'work',
      searchFields: ['work'],
      relations: ['detail'],
      relationSelect: {
        detail: [
          'title',
          'cover',
          'intro',
          'create_time',
          'update_time',
          'has_section',
          'is_orphan',
          'size',
          'amount',
        ],
      },
      buildQuery: (qb) => {
        qb.andWhere('work.exist = :exist', { exist: 1 });
        if (params.domain) {
          qb.andWhere('work.domain = :domain', {
            domain: params.domain,
          });
        }
        if (params.category) {
          qb.andWhere('work.category = :category', {
            category: params.category,
          });
        }
      },
    });
  }

  async update(hash_id: string, updateWorkDto: UpdateWorkDto): Promise<Work> {
    const fields: Field[] = [
      // 'hash_id',
      // 'path',
      // 'work',
      // 'domain',
      // 'category',
      // 'create_time',
      'state',
      'exist',
    ];
    return await updateOneIfExists({
      repository: this.workRepository,
      dto: updateWorkDto,
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
      repository: this.workRepository,
      uniqueKey: 'hash_id',
      values: hash_id,
      mode: options?.safe ? 'safe' : 'fast', // 默认 fast
      logger: this.logger,
    });
  }

  async initMany(
    workCreateDtos: Partial<Work>[],
    manager: EntityManager,
  ): Promise<Work[]> {
    const updateFields: Field[] = ['exist'];

    return initManyIfNotExists({
      repository: manager.getRepository(Work),
      dtos: workCreateDtos,
      uniqueKey: 'hash_id',
      updateFields: updateFields,
    });
  }
}
