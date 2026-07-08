import { Repository, ObjectLiteral, FindOptionsWhere } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { assignNonNullFields } from '../utils/assign-non-null-fields';

export interface UpdateOneOptions<T extends ObjectLiteral, K extends keyof T> {
  repository: Repository<T>;
  dto: Partial<T>; // 更新数据
  uniqueKey: K; // 唯一键字段
  uniqueValue?: T[K]; // 唯一键值
  updateFields: (keyof T)[]; // 允许更新的字段
}

export async function updateOneIfExists<
  T extends ObjectLiteral,
  K extends keyof T,
>(options: UpdateOneOptions<T, K>): Promise<T> {
  const { repository, dto, uniqueKey, uniqueValue, updateFields } = options;

  const id = dto[uniqueKey] || uniqueValue;
  if (id === undefined || id === null) {
    throw new NotFoundException(
      `Update failed: ${String(uniqueKey)} must be provided`,
    );
  }

  // 查找现有实体
  const record = await repository.findOne({
    where: { [uniqueKey]: id } as FindOptionsWhere<T>,
  });

  if (!record) {
    throw new NotFoundException(
      `${repository.metadata.name}<${String(uniqueKey)}=${id}> not found`,
    );
  }

  // 更新允许的字段
  assignNonNullFields(record, dto, updateFields);

  // 保存更新
  return repository.save(record);
}
