import { Injectable, Inject, Logger } from '@nestjs/common';
import { AbstractTask } from './abstract-task.interface';

@Injectable()
export class TaskRunnerService {
  private readonly logger = new Logger(TaskRunnerService.name);

  constructor(@Inject('TASKS') private readonly tasks: AbstractTask[]) {}

  async runAll() {
    for (const task of this.tasks) {
      this.logger.log(`Running task: ${task.name}`);
      await task.run();
    }
  }
}
