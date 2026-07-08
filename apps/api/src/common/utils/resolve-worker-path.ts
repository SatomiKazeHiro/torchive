import * as path from 'path';
import * as fs from 'fs';

export function resolveWorkerPath(workFileName: string) {
  const root = process.cwd();

  // 1. 生产环境（dist）
  const distWorker = path.join(root, 'dist', 'common', 'workers', workFileName);
  if (fs.existsSync(distWorker)) return distWorker;

  // 2. 开发环境（ts-node）
  const tsWorker = path.join(root, 'src', 'common', 'workers', workFileName);
  if (fs.existsSync(tsWorker)) return tsWorker;

  throw new Error(
    `Worker file not found: dist/common/workers/${workFileName} or src/common/workers/${workFileName}`,
  );
}
