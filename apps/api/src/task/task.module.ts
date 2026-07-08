import { Module } from '@nestjs/common';

import { DomainModule } from '@/domain/domain.module';
import { CategoryModule } from '@/category/category.module';
import { WorkModule } from '@/work/work.module';
import { DetailModule } from '@/detail/detail.module';

import { ScanWorkTask } from './scan-work.task';
import { AbstractTask } from './abstract-task.interface';
import { TaskRunnerService } from './task-runner.service';

const TASK_PROVIDERS = [ScanWorkTask];

@Module({
  imports: [DomainModule, CategoryModule, WorkModule, DetailModule],
  providers: [
    ...TASK_PROVIDERS, // 先注册任务类
    {
      provide: 'TASKS',
      useFactory: (...tasks: AbstractTask[]) => tasks,
      inject: [...TASK_PROVIDERS], // 然后注入这些类的实例
    },
    TaskRunnerService,
  ],
  exports: [TaskRunnerService],
})
export class TaskModule {}
