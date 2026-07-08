import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserWatchLater } from './entities/user-watch-later.entity';
import { UserWatchLaterService } from './user-watch-later.service';
import { UserWatchLaterController } from './user-watch-later.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserWatchLater], 'work-sqlite')],
  controllers: [UserWatchLaterController],
  providers: [UserWatchLaterService],
  exports: [UserWatchLaterService],
})
export class UserWatchLaterModule {}
