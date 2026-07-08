import { workerData, parentPort } from 'worker_threads';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as dayjs from 'dayjs';

import { ScanInfo, EntitiesJson } from '../../types/scan';
import { cyrb53 } from '../utils/cyr53';
import { naturalCompare } from '../utils/sort';

interface DomainParams {
  domain: string;
}

interface CategoryParams extends DomainParams {
  category: string;
}

interface WorkParams extends CategoryParams {
  work: string;
}

interface OrphanWorkParams extends WorkParams {
  categoryPath: string;
}

const CONCURRENCY_LIMIT = 20;

const scanResult: ScanInfo = {
  domains: [],
  categories: [],
  works: [],
  details: [],
};

const imageExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

/* ------------------ 工具 ------------------ */

function generateHashId(...parts: string[]): string {
  return cyrb53(parts.join('>')).toString(32);
}

function getCurrent(): string {
  return dayjs().format('YYYY-MM-DD HH:mm:ss');
}

/**
 * 简单并发池（保持结果与 tasks 顺序一致）
 */
async function asyncPool<T>(
  limit: number,
  tasks: (() => Promise<T>)[],
): Promise<T[]> {
  const results = new Array<T | undefined>(tasks.length);
  const executing = new Set<Promise<void>>();

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    const p = task().then((res) => {
      results[i] = res;
    });

    const e = p.finally(() => {
      executing.delete(e);
    });

    executing.add(e);

    if (executing.size >= limit) {
      await Promise.race(executing);
    }
  }

  await Promise.all(executing);
  return results as T[];
}

/* ------------------ 创建结构 ------------------ */

function createDomain(domain: string): void {
  scanResult.domains.push({
    domain,
    name: domain,
    state: 1,
    exist: 1,
  });
}

function createCategory(params: CategoryParams): void {
  const { domain, category } = params;
  scanResult.categories.push({
    hash_id: generateHashId(`${domain}>${category}`),
    category,
    name: category,
    domain,
    state: 1,
    exist: 1,
  });
}

/* ------------------ Work 扫描 ------------------ */

async function createWork(workPath: string, params: WorkParams): Promise<void> {
  const { domain, category, work } = params;

  const virtualPath = `${domain}>${category}>${work}`;
  const hash_id = generateHashId(virtualPath);
  const currentTime = getCurrent();

  scanResult.works.push({
    hash_id,
    path: virtualPath,
    work,
    domain,
    category,
    state: 1,
    exist: 1,
  });

  const entitiesJson: EntitiesJson = {
    assets: [],
    section: [],
    orphanAssets: [],
  };

  let cover: string | undefined;
  let findCover = false;
  let relationSize = 0;
  let relationAmount = 0;

  const entries = await fs.readdir(workPath, { withFileTypes: true });

  /* ---- 处理 assets（已聚合内容） 文件 ---- */

  const fileEntries = entries
    .filter((e) => e.isFile())
    .sort((a, b) => naturalCompare(a.name, b.name));

  const fileStats = await asyncPool(
    CONCURRENCY_LIMIT,
    fileEntries.map((e) => async () => {
      const entityPath = path.join(workPath, e.name);
      const stat = await fs.stat(entityPath);
      return { name: e.name, size: stat.size };
    }),
  );

  for (const { name, size } of fileStats) {
    relationSize += size;
    relationAmount += 1;
    entitiesJson.assets.push(name);

    const ext = path.extname(name).toLowerCase();
    if (!cover && imageExt.includes(ext)) {
      cover = name;
    } else if (!findCover && name.toLowerCase().startsWith('cover')) {
      cover = name;
      findCover = true;
    }
  }

  /* ---- 处理 section 目录 ---- */

  const dirEntries = entries
    .filter((e) => e.isDirectory())
    .sort((a, b) => naturalCompare(a.name, b.name));

  // 1. 并发收集所有 section 的 IO 数据（保持顺序）
  const sectionResults = await asyncPool(
    CONCURRENCY_LIMIT,
    dirEntries.map((e) => async () => {
      const sectionPath = path.join(workPath, e.name);
      const items = await fs.readdir(sectionPath, { withFileTypes: true });

      const fileItems = items
        .filter((i) => i.isFile())
        .sort((a, b) => naturalCompare(a.name, b.name));

      const sectionFiles = await asyncPool(
        CONCURRENCY_LIMIT,
        fileItems.map((i) => async () => {
          const full = path.join(sectionPath, i.name);
          const stat = await fs.stat(full);
          return { name: i.name, size: stat.size };
        }),
      );

      return {
        name: e.name,
        files: sectionFiles.map((f) => f.name),
        sizes: sectionFiles.map((f) => f.size),
      };
    }),
  );

  // 2. 按排序顺序遍历，顺序处理：数据统计 + 封面选择
  for (const sec of sectionResults) {
    entitiesJson.section.push({ name: sec.name, files: sec.files });

    for (let i = 0; i < sec.files.length; i++) {
      const name = sec.files[i];
      const size = sec.sizes[i];

      relationSize += size;
      relationAmount += 1;

      const coverRelativePath = `/${sec.name}/${name}`;
      const ext = path.extname(name).toLowerCase();
      if (!cover && imageExt.includes(ext)) {
        cover = coverRelativePath;
      } else if (!findCover && name.toLowerCase().startsWith('cover')) {
        cover = coverRelativePath;
        findCover = true;
      }
    }
  }

  scanResult.details.push({
    hash_id,
    domain,
    category,
    name: work,
    cover: cover,
    amount: relationAmount,
    size: relationSize,
    has_section: +!!entitiesJson.section.length,
    is_orphan: +!!entitiesJson.orphanAssets.length,
    create_time: currentTime,
    update_time: currentTime,
    entities_json: JSON.stringify(entitiesJson),
  });
}

/* ------------------ Orphan Asset（游离内容） ------------------ */

function createOrphanAsset(
  size: number,
  files: string[],
  params: OrphanWorkParams,
): void {
  const { domain, category, work } = params;

  const virtualPath = `${domain}>${category}>${work}`;
  const hash_id = generateHashId(virtualPath);
  const currentTime = getCurrent();

  let cover: unknown;
  let findCover = false;

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (!cover && imageExt.includes(ext)) {
      cover = file;
    } else if (!findCover && file.toLowerCase().includes('cover')) {
      cover = file;
      findCover = true;
    }
  }

  scanResult.works.push({
    hash_id,
    path: virtualPath,
    work,
    domain,
    category,
    state: 1,
    exist: 1,
  });

  const entitiesJson: EntitiesJson = {
    orphanAssets: files,
    assets: [],
    section: [],
  };

  scanResult.details.push({
    hash_id,
    domain,
    category,
    name: work,
    cover: cover as string,
    amount: files.length,
    size,
    has_section: 0,
    is_orphan: 1,
    create_time: currentTime,
    update_time: currentTime,
    entities_json: JSON.stringify(entitiesJson),
  });
}

/* ------------------ 扫描 Category ------------------ */

async function scanCategory(categoryPath: string, params: CategoryParams) {
  const { domain, category } = params;

  const orphanMap = new Map<string, string[]>();
  const attachedSet = new Set<string>();

  const entries = await fs.readdir(categoryPath, { withFileTypes: true });

  /* ---- 先处理目录资源 ---- */

  const dirTasks = entries
    .filter((e) => e.isDirectory())
    .map((e) => async () => {
      const payload = { domain, category, work: e.name };
      await createWork(path.join(categoryPath, e.name), payload);
      attachedSet.add(e.name);
    });

  await asyncPool(CONCURRENCY_LIMIT, dirTasks);

  /* ---- 收集散落文件 ---- */

  for (const entry of entries) {
    if (!entry.isFile()) continue;

    const { name } = path.parse(entry.name);

    if (!orphanMap.has(name)) orphanMap.set(name, []);
    orphanMap.get(name)!.push(entry.name);
  }

  /* ---- 处理 Orphan Asset（游离内容） ---- */

  const orphanTasks = [...orphanMap.entries()].map(
    ([name, files]) =>
      async () => {
        const sizeStats = await asyncPool(
          CONCURRENCY_LIMIT,
          files.map((f) => async () => {
            const stat = await fs.stat(path.join(categoryPath, f));
            return stat.size;
          }),
        );

        const size = sizeStats.reduce((a, b) => a + b, 0);

        if (attachedSet.has(name)) {
          const detail = scanResult.details.find((d) => d.name === name);
          if (!detail) return;

          detail.amount += files.length;
          detail.size += size;

          const json = JSON.parse(detail.entities_json) as EntitiesJson;
          json.orphanAssets = files;
          detail.entities_json = JSON.stringify(json);
        } else {
          createOrphanAsset(size, files, {
            domain,
            category,
            work: name,
            categoryPath,
          });
        }
      },
  );

  await asyncPool(CONCURRENCY_LIMIT, orphanTasks);
}

/* ------------------ 扫描 Domain ------------------ */

async function scanDomain(domainPath: string, params: DomainParams) {
  const { domain } = params;
  const entries = await fs.readdir(domainPath, { withFileTypes: true });

  const tasks = entries
    .filter((e) => e.isDirectory())
    .map((e) => async () => {
      const payload = { domain, category: e.name };
      createCategory(payload);
      await scanCategory(path.join(domainPath, e.name), payload);
    });

  await asyncPool(CONCURRENCY_LIMIT, tasks);
}

/* ------------------ 主入口 ------------------ */

async function main(domain: string, domainPath: string) {
  createDomain(domain);
  await scanDomain(domainPath, { domain });
}

/* ------------------ worker ------------------ */

try {
  const { domain, domainPath } = workerData as {
    domain: string;
    domainPath: string;
  };

  main(domain, domainPath)
    .then(() => {
      parentPort?.postMessage(scanResult);
    })
    .catch((err) => {
      parentPort?.postMessage({
        error: err instanceof Error ? err.message : String(err),
      });
    });
} catch (err) {
  parentPort?.postMessage({ error: (err as Error).message });
}
