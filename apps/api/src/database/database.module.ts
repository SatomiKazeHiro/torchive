import { join } from 'path';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { Domain } from '@/domain/entities/domain.entity';
import { Category } from '@/category/entities/category.entity';
import { Work } from '@/work/entities/work.entity';
import { Detail } from '@/detail/entities/detail.entity';
import { User } from '@/user/entities/user.entity';
import { UserFavorite } from '@/user-favorite/entities/user-favorite.entity';
import { UserHistory } from '@/user-history/entities/user-history.entity';
import { UserWatchLater } from '@/user-watch-later/entities/user-watch-later.entity';

@Module({
  imports: [
    // TypeORM 根模块配置
    TypeOrmModule.forRootAsync({
      name: 'work-sqlite', // 添加连接名（Connection Name），用来标识这个连接（尤其在有多个数据库时），业务模块中用 forFeature(..., 'work-sqlite') 时就依赖这个名字
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        name: 'work-sqlite', // 添加连接名（手动实例化连接 new DataSource({ name: 'work-sqlite', ... }) 时指定，可选，但必须与上面一致）
        type: 'better-sqlite3',
        database: join(config.get('SQLITE_DB_PATH')!, 'work.sqlite'),
        // entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        entities: [
          Domain,
          Category,
          Work,
          Detail,
          User,
          UserFavorite,
          UserHistory,
          UserWatchLater,
        ],
        synchronize: true, // 开发阶段可为 true（自动创建和改表），生产建议为 false
      }),
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
