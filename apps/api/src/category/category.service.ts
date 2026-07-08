import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository, EntityManager } from 'typeorm';

import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto, Field } from './dto/update-category.dto';

import { createIfNotExists } from '@/common/typeorm/create';
import { updateOneIfExists } from '@/common/typeorm/update';
import { removeIfExists } from '@/common/typeorm/remove';
import { initManyIfNotExists } from '@/common/typeorm/init-many';
import { findByPage } from '@/common/typeorm/find';
import { FindCategoryByPageDto } from '@/common/typeorm/find.category.dto';

interface CategoryStatsRow {
  categoryId: string;
  workCount: string | number;
  totalAmount: string | number;
  totalSize: string | number;
}

@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name);

  constructor(
    @InjectRepository(Category, 'work-sqlite')
    private readonly categoryRepository: Repository<Category>,

    @InjectDataSource('work-sqlite')
    private readonly dataSource: DataSource,
  ) {}

  async create(createCategoryDto: CreateCategoryDto) {
    return await createIfNotExists({
      repository: this.categoryRepository,
      dto: createCategoryDto,
      uniqueKey: 'hash_id',
      errorMessage: `Category<${createCategoryDto.hash_id}> has exist`,
    });
  }

  async findAll() {
    return await this.categoryRepository.find();
  }

  async findOne(hash_id: string) {
    return this.categoryRepository.findOne({
      where: { hash_id },
    });
  }

  async findByPage(params: FindCategoryByPageDto) {
    const result = await findByPage({
      ...params,
      repository: this.categoryRepository,
      alias: 'category',
      searchFields: ['category', 'name'],
      buildQuery: (qb) => {
        qb.andWhere('category.exist = :exist', { exist: 1 });
        if (params.domain) {
          qb.andWhere('category.domain = :domain', {
            domain: params.domain,
          });
        }
      },
    });

    // 如果需要统计数据
    if (params.withStats && result.data.length > 0) {
      const stats = await this.getCategoriesStats(
        result.data.map((c) => c.hash_id),
      );
      // 将统计数据合并到结果中
      result.data = result.data.map((category) => ({
        ...category,
        stats: stats[category.hash_id] || {
          workCount: 0,
          totalAmount: 0,
          totalSize: 0,
        },
      }));
    }

    return result;
  }

  /**
   * 获取分类统计数据
   * @param categoryIds 分类ID列表
   * @returns 每个分类的统计数据
   */
  private async getCategoriesStats(
    categoryIds: string[],
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

    // 初始化所有分类的统计数据为0
    categoryIds.forEach((id) => {
      stats[id] = { workCount: 0, totalAmount: 0, totalSize: 0 };
    });

    // 查询每个分类的统计信息
    const placeholders = categoryIds.map(() => '?').join(',');
    const query = `
      SELECT 
        c.hash_id as categoryId,
        COUNT(w.hash_id) as workCount,
        COALESCE(SUM(d.amount), 0) as totalAmount,
        COALESCE(SUM(d.size), 0) as totalSize
      FROM categories_index c
      LEFT JOIN works_index w ON w.category = c.category AND w.domain = c.domain AND w.exist = 1
      LEFT JOIN work_detail d ON d.hash_id = w.hash_id
      WHERE c.hash_id IN (${placeholders})
      GROUP BY c.hash_id
    `;

    const results = await this.dataSource.query<CategoryStatsRow[]>(
      query,
      categoryIds,
    );

    // 合并查询结果
    results.forEach((row) => {
      stats[row.categoryId] = {
        workCount: parseInt(String(row.workCount), 10) || 0,
        totalAmount: parseInt(String(row.totalAmount), 10) || 0,
        totalSize: parseInt(String(row.totalSize), 10) || 0,
      };
    });

    return stats;
  }

  async update(
    hash_id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    const fields: Field[] = [
      'name',
      'page_template',
      'work_page_template',
      'state',
      'exist',
    ];
    return await updateOneIfExists({
      repository: this.categoryRepository,
      dto: updateCategoryDto,
      uniqueKey: 'hash_id',
      uniqueValue: hash_id,
      updateFields: fields,
    });
  }

  async remove(hash_id: string | string[], options?: { safe?: boolean }) {
    return await removeIfExists({
      dataSource: this.dataSource,
      repository: this.categoryRepository,
      uniqueKey: 'hash_id',
      values: hash_id,
      mode: options?.safe ? 'safe' : 'fast',
      logger: this.logger,
    });
  }

  async initMany(
    categoryCreateDtos: Partial<Category>[],
    manager: EntityManager,
  ): Promise<Category[]> {
    const updateFields: Field[] = ['exist'];

    return initManyIfNotExists({
      repository: manager.getRepository(Category),
      dtos: categoryCreateDtos,
      uniqueKey: 'hash_id',
      updateFields: updateFields,
    });
  }
}
