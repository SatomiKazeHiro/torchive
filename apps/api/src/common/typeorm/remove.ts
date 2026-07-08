import { NotFoundException, Logger } from '@nestjs/common';
import {
  Repository,
  DataSource,
  ObjectLiteral,
  In,
  FindOptionsWhere,
} from 'typeorm';
import { normalizeToArray } from '../utils/array';

export type RemoveMode = 'safe' | 'fast';

export interface RemoveIfExistsOptions<
  T extends ObjectLiteral,
  K extends keyof T,
> {
  dataSource: DataSource;
  repository: Repository<T>;
  uniqueKey: K;
  values: T[K] | T[K][];
  mode?: RemoveMode; // 默认 fast
  logger?: ((msg: string) => void) | Logger;
}

export async function removeIfExists<
  T extends ObjectLiteral,
  K extends keyof T,
>(
  options: RemoveIfExistsOptions<T, K>,
): Promise<{ deleted: number; mode: RemoveMode; items: T[K][] }> {
  const {
    dataSource,
    repository,
    uniqueKey,
    values,
    mode = 'fast',
    logger,
  } = options;
  const keyStr = String(uniqueKey);

  // 输出
  const log = (msg: string) => {
    if (typeof logger === 'function') {
      logger(msg);
    } else if (logger instanceof Logger) {
      logger.log(msg);
    }
  };

  // 需要删除的主键的值集合
  const valArr: T[K][] = normalizeToArray(values);
  if (valArr.length === 0) {
    throw new NotFoundException(`No ${keyStr} specified`);
  }
  const valsStr = valArr.join(', ');

  // 手动开启事务
  return dataSource.transaction(async (manager) => {
    const repo = manager.getRepository<T>(repository.target);

    const where: FindOptionsWhere<T> = {
      [uniqueKey]: In(valArr),
    } as FindOptionsWhere<T>;

    if (mode === 'safe') {
      // --- safe 模式: 先查再删 ---
      // 如果希望先查再删（能拿到实体，触发 hook），可以改用 remove
      const records = await repo.find({ where });
      const deleted = records.length;

      if (deleted === 0) {
        throw new NotFoundException(`${keyStr} not found: ${valsStr}`);
      }
      await repo.remove(records);

      log?.(`Safe remove: deleted=${deleted}, ${keyStr}=${valsStr}`);
      return { deleted, mode, items: valArr };
    } else {
      // --- fast 模式: 直接 delete ---
      // 快删 delete(where) 不会触发 entity listeners 和 subscribers，只是直接发 SQL 删除
      const result = await repo.delete(where);
      const deleted = result.affected;

      if (!deleted || deleted === 0) {
        throw new NotFoundException(`${keyStr} not found: ${valsStr}`);
      }

      log?.(`Fast remove: deleted=${deleted}, ${keyStr}=${valsStr}`);
      return { deleted, mode, items: valArr };
    }
  });
}
