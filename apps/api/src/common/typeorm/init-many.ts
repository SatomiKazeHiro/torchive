import {
  Repository,
  ObjectLiteral,
  In,
  FindOptionsWhere,
  DeepPartial,
} from 'typeorm';
import { assignNonNullFields } from '../utils/assign-non-null-fields';

export interface InitManyOptions<T extends ObjectLiteral, K extends keyof T> {
  repository: Repository<T>;
  dtos: Partial<T>[];
  uniqueKey: K; // 唯一字段
  updateFields?: (keyof T)[]; // 可更新的字段
}

export async function initManyIfNotExists<
  T extends ObjectLiteral,
  K extends keyof T,
>(options: InitManyOptions<T, K>): Promise<T[]> {
  const { repository, dtos, uniqueKey, updateFields = [] } = options;

  if (!dtos.length) return [];

  // 筛选有效的唯一键值
  const uniqueValues = dtos
    .map((dto) => dto[uniqueKey] as unknown)
    .filter((v): v is T[K] => v !== undefined && v !== null);

  // 查出已有实体
  const existingList = await repository.find({
    where: { [uniqueKey]: In(uniqueValues) } as FindOptionsWhere<T>,
  });

  const existingMap = new Map<T[K], T>(
    existingList.map((e) => [e[uniqueKey], e]),
  );

  const results: T[] = [];

  // 遍历 DTO，决定是更新还是创建
  for (const dto of dtos) {
    const keyValue = dto[uniqueKey];
    if (keyValue === undefined || keyValue === null) continue;

    const record = existingMap.get(keyValue);

    if (record) {
      assignNonNullFields(record, dto, updateFields);
      results.push(await repository.save(record));
    } else {
      const newEntity = repository.create(dto as DeepPartial<T>);
      results.push(await repository.save(newEntity));
    }
  }

  return results;
}
