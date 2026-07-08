import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StartupService } from './startup/startup.service';

import { DatabaseModule } from './database/database.module';
import { TaskModule } from './task/task.module';

import { DomainModule } from './domain/domain.module';
import { CategoryModule } from './category/category.module';
import { WorkModule } from './work/work.module';
import { DetailModule } from './detail/detail.module';
import { UserModule } from './user/user.module';
import { UserFavoriteModule } from './user-favorite/user-favorite.module';
import { UserHistoryModule } from './user-history/user-history.module';
import { UserWatchLaterModule } from './user-watch-later/user-watch-later.module';

@Module({
  imports: [
    // 如果需要使用 .env，则先引入 ConfigModule
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true, // 全局生效
    }),
    DatabaseModule,
    TaskModule,

    DomainModule,
    CategoryModule,
    WorkModule,
    DetailModule,
    UserModule,
    UserFavoriteModule,
    UserHistoryModule,
    UserWatchLaterModule,
  ],
  providers: [StartupService],
})
export class AppModule {}
