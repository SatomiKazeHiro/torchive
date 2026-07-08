import { Repository, ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { FindByPageDto } from './find.dto';
import { FindByPageResult } from './find.result';

export interface FindByPageParams<
  T extends ObjectLiteral,
> extends FindByPageDto {
  repository: Repository<T>;
  alias: string; // 主表查询别名
  searchFields?: (keyof T)[]; // 主表要模糊查询的字段
  select?: (keyof T)[]; // 主表需要 select 的字段
  relations?: string[]; // 是否需要预加载关联
  relationSelect?: Record<string, string[]>; // 预加载关联的字段
  buildQuery?: (qb: SelectQueryBuilder<T>) => void; // 自定义扩展查询
}

export async function findByPage<T extends ObjectLiteral>(
  options: FindByPageParams<T>,
): Promise<FindByPageResult<T>> {
  const {
    repository,
    alias,
    page = 1,
    limit = 10,
    keyword,
    searchFields = [],
    order,
    random,
    select,
    relations,
    relationSelect,
    buildQuery,
  } = options;

  const qb = repository.createQueryBuilder(alias);

  // 模糊查询
  if (keyword && searchFields.length > 0) {
    const whereExpr = searchFields
      .map((field) => `${alias}.${String(field)} LIKE :kw`)
      .join(' OR ');
    qb.where(whereExpr, { kw: `%${keyword}%` });
  }

  // 1. 先建立关联（必须在 orderBy 之前，否则 TypeORM 无法找到关联表元数据）
  if (relations) {
    for (const rel of relations) {
      // 默认 leftJoinAndSelect 会拉全字段
      qb.leftJoinAndSelect(`${alias}.${rel}`, rel);
    }
  }

  // 2. 再设置排序
  if (random) {
    // 随机模式
    qb.orderBy('RANDOM()'); // SQLite / PG
    // qb.orderBy('RAND()'); // MySQL
  } else if (order) {
    // 排序
    for (const [field, direction] of Object.entries(order)) {
      if (field.includes('.')) {
        // 如果包含点，说明已经指定了别名，如 detail.create_time
        qb.addOrderBy(field, direction);
      } else {
        // 否则默认拼上主表别名
        qb.addOrderBy(`${alias}.${field}`, direction);
      }
    }
  }

  if (select || relationSelect) {
    const baseSelect: string[] = [];

    // 1. 主表字段
    if (select && select.length > 0) {
      // 拼接 alias.xxx
      baseSelect.push(...select.map((f) => `${alias}.${String(f)}`));
    } else {
      // 默认全选
      baseSelect.push(`${alias}`);
    }

    // 2. 处理关联字段 relationSelect
    if (relationSelect) {
      Object.keys(relationSelect).forEach((rel) => {
        const fields = relationSelect[rel].map((f) => `${rel}.${f}`);
        baseSelect.push(...fields);
      });
    }

    qb.select(baseSelect);
  }

  // 扩展查询
  if (buildQuery) {
    buildQuery(qb);
  }

  // 分页
  qb.skip((page - 1) * limit).take(limit);

  // 执行查询
  const [data, total] = await qb.getManyAndCount();

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}
