import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository, EntityManager } from 'typeorm';

import { Domain } from './entities/domain.entity';
import { CreateDomainDto } from './dto/create-domain.dto';
import { UpdateDomainDto, Field } from './dto/update-domain.dto';

import { createIfNotExists } from '@/common/typeorm/create';
import { updateOneIfExists } from '@/common/typeorm/update';
import { removeIfExists } from '@/common/typeorm/remove';
import { initManyIfNotExists } from '@/common/typeorm/init-many';
import { findByPage } from '@/common/typeorm/find';
import { FindByPageDto } from '@/common/typeorm/find.dto';

interface DomainStatsRow {
  domainId: string;
  workCount: string | number;
  totalAmount: string | number;
  totalSize: string | number;
}

@Injectable()
export class DomainService {
  private readonly logger = new Logger(DomainService.name);

  constructor(
    @InjectRepository(Domain, 'work-sqlite')
    private readonly domainRepository: Repository<Domain>,

    @InjectDataSource('work-sqlite')
    private readonly dataSource: DataSource,
  ) {}

  async create(createDomainDto: CreateDomainDto) {
    return await createIfNotExists({
      repository: this.domainRepository,
      dto: createDomainDto,
      uniqueKey: 'domain',
      errorMessage: `Domain<${createDomainDto.domain}> has exist`,
    });
  }

  async findAll() {
    return await this.domainRepository.find();
  }

  async findOne(domain: string) {
    return await this.domainRepository.findOne({
      where: { domain },
    });
  }

  async findByPage(params: FindByPageDto<Domain>) {
    const result = await findByPage({
      ...params,
      repository: this.domainRepository,
      alias: 'domain',
      searchFields: ['domain', 'name'],
      buildQuery: (qb) => {
        qb.andWhere('domain.exist = :exist', { exist: 1 });
      },
    });

    // 如果需要统计数据
    if (params.withStats && result.data.length > 0) {
      const stats = await this.getDomainsStats(
        result.data.map((d) => d.domain),
      );
      // 将统计数据合并到结果中
      result.data = result.data.map((domain) => ({
        ...domain,
        stats: stats[domain.domain] || {
          workCount: 0,
          totalAmount: 0,
          totalSize: 0,
        },
      }));
    }

    return result;
  }

  /**
   * 获取主题统计数据
   * @param domainIds 主题ID列表（即 domain 字段值）
   * @returns 每个主题的统计数据
   */
  private async getDomainsStats(
    domainIds: string[],
  ): Promise<
    Record<
      string,
      { workCount: number; totalAmount: number; totalSize: number }
    >
  > {
    const stats: Record<
      string,
      { workCount: number; totalAmount: number; totalSize: number }
    > = {};

    // 初始化所有主题的统计数据为0
    domainIds.forEach((id) => {
      stats[id] = { workCount: 0, totalAmount: 0, totalSize: 0 };
    });

    // 查询每个主题的统计信息
    const placeholders = domainIds.map(() => '?').join(',');
    const query = `
      SELECT 
        d.domain as domainId,
        COUNT(w.hash_id) as workCount,
        COALESCE(SUM(det.amount), 0) as totalAmount,
        COALESCE(SUM(det.size), 0) as totalSize
      FROM domains_index d
      LEFT JOIN works_index w ON w.domain = d.domain AND w.exist = 1
      LEFT JOIN work_detail det ON det.hash_id = w.hash_id
      WHERE d.domain IN (${placeholders})
      GROUP BY d.domain
    `;

    const results = await this.dataSource.query<DomainStatsRow[]>(
      query,
      domainIds,
    );

    // 合并查询结果
    results.forEach((row) => {
      stats[row.domainId] = {
        workCount: parseInt(String(row.workCount), 10) || 0,
        totalAmount: parseInt(String(row.totalAmount), 10) || 0,
        totalSize: parseInt(String(row.totalSize), 10) || 0,
      };
    });

    return stats;
  }

  async update(
    domain: string,
    updateDomainDto: UpdateDomainDto,
  ): Promise<Domain> {
    const fields: Field[] = ['name', 'page_template', 'state', 'exist'];
    return await updateOneIfExists({
      repository: this.domainRepository,
      dto: updateDomainDto,
      uniqueKey: 'domain',
      uniqueValue: domain,
      updateFields: fields,
    });
  }

  async remove(domain: string | string[], options?: { safe?: boolean }) {
    return await removeIfExists({
      dataSource: this.dataSource,
      repository: this.domainRepository,
      uniqueKey: 'domain',
      values: domain,
      mode: options?.safe ? 'safe' : 'fast',
      logger: this.logger,
    });
  }

  async initMany(
    domainCreateDtos: Partial<Domain>[],
    manager: EntityManager,
  ): Promise<Domain[]> {
    const updateFields: Field[] = ['exist'];

    return initManyIfNotExists({
      repository: manager.getRepository(Domain),
      dtos: domainCreateDtos,
      uniqueKey: 'domain',
      updateFields: updateFields,
    });
  }
}
