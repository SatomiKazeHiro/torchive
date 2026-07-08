import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TaskRunnerService } from '@/task/task-runner.service';
import { UserService } from '@/user/user.service';

@Injectable()
export class StartupService implements OnApplicationBootstrap {
  private readonly logger = new Logger(StartupService.name);

  constructor(
    private readonly runner: TaskRunnerService,
    private readonly userService: UserService,
    private readonly config: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    this.logger.log('Running startup tasks...');
    await this.userService.ensureSuperAdmin(
      this.config.get<string>('ADMIN_INITIAL_PASSWORD'),
    );
    await this.runner.runAll();
    this.logger.log('Startup tasks completed.');
  }
}
