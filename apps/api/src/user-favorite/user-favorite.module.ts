import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserFavorite } from './entities/user-favorite.entity';
import { UserFavoriteService } from './user-favorite.service';
import { UserFavoriteController } from './user-favorite.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserFavorite], 'work-sqlite')],
  controllers: [UserFavoriteController],
  providers: [UserFavoriteService],
  exports: [UserFavoriteService],
})
export class UserFavoriteModule {}
