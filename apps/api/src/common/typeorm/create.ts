import { ConflictException } from '@nestjs/common';
import { Repository, ObjectLiteral, FindOptionsWhere } from 'typeorm';

export interface createIfNotExistsOptions<
  T extends ObjectLiteral,
  K extends keyof T,
> {
  repository: Repository<T>;
  dto: Partial<T>;
  uniqueKey: K;
  errorMessage?: string;
}

export async function createIfNotExists<
  T extends ObjectLiteral,
  K extends keyof T,
>(options: createIfNotExistsOptions<T, K>): Promise<T> {
  const { repository, dto, uniqueKey, errorMessage } = options;
  const value = dto[uniqueKey];

  if (value == null) {
    throw new Error(`Unique key "${String(uniqueKey)}" is missing in dto`);
  }

  // 用 FindOptionsWhere<T> 明确断言
  const where: FindOptionsWhere<T> = {
    [uniqueKey]: value,
  } as FindOptionsWhere<T>;

  const existing = await repository.findOne({ where });

  if (existing) {
    throw new ConflictException(
      errorMessage ?? `${String(uniqueKey)}<${value}> already exists`,
    );
  }

  return await repository.save(dto as T);
}
