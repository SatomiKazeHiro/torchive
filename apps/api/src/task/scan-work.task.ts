import * as fs from 'fs/promises';
import * as path from 'path';

import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { AbstractTask } from './abstract-task.interface';
import { ScanInfo } from '@/types/scan';
import { runWorker } from '@/common/workers/run-worker';
import { resolveWorkerPath } from '@/common/utils/resolve-worker-path';

import { DomainService } from '@/domain/domain.service';
import { CategoryService } from '@/category/category.service';
import { WorkService } from '@/work/work.service';
import { DetailService } from '@/detail/detail.service';

@Injectable()
export class ScanWorkTask implements AbstractTask {
  private readonly logger = new Logger(ScanWorkTask.name);
  readonly name = 'ScanWorkTask';
  private writeQueue = Promise.resolve(); // 串行队列

  constructor(
    private configService: ConfigService,
    private readonly domainService: DomainService,
    private readonly categoryService: CategoryService,
    private readonly workService: WorkService,
    private readonly detailService: DetailService,

    @InjectDataSource('work-sqlite')
    private readonly dataSource: DataSource, // 注入 DataSource 来手动开启事务
  ) {}

  async run(): Promise<void> {
    const workDirPath = this.configService.getOrThrow<string>('WORK_DIR_PATH');

    const workerTasks: Promise<void>[] = [];
    const domainDirs = await fs.readdir(workDirPath);
    for (const dir of domainDirs) {
      const domainFullPath = path.join(workDirPath, dir);
      const stat = await fs.stat(domainFullPath);
      if (stat.isDirectory()) {
        workerTasks.push(this.runWorker(domainFullPath));
      }
    }

    await Promise.all(workerTasks);
  }

  async runWorker(domainPath: string) {
    const normalizedPath = path.normalize(domainPath);
    const domain = normalizedPath.split(path.sep).pop() as string;

    // 因为 SQLite 是单文件数据库，多个连接并发写也容易锁表，这里并行扫描
    const workerPath = resolveWorkerPath('work.worker.js');

    const data = await runWorker<ScanInfo>(workerPath, { domain, domainPath });

    // 串行化 DB 写入
    this.writeQueue = this.writeQueue.then(() => this.writeToDB(data));
    return this.writeQueue;
  }

  async writeToDB(scanInfo: ScanInfo) {
    const { domains, categories, works, details } = scanInfo;

    await this.dataSource.transaction(async (manager) => {
      // 1. domain
      if (domains?.length) {
        await this.domainService.initMany(domains, manager);
      }

      // 2. category
      if (categories?.length) {
        await this.categoryService.initMany(categories, manager);
      }

      // 3. detail
      if (details?.length) {
        await this.detailService.initMany(details, manager);
      }

      // 4. work（依赖 detail)
      if (works?.length) {
        await this.workService.initMany(works, manager);
      }
    });
  }
}
