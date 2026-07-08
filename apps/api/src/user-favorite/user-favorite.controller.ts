import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
} from '@nestjs/common';

import { UserFavoriteService } from './user-favorite.service';
import { CreateUserFavoriteDto } from './dto/create-user-favorite.dto';
import { FindByPageDto } from '@/common/typeorm/find.dto';

@Controller('user-favorites')
export class UserFavoriteController {
  constructor(private readonly favoriteService: UserFavoriteService) {}

  @Post()
  create(@Body() dto: CreateUserFavoriteDto) {
    return this.favoriteService.create(dto);
  }

  @Get()
  findAll(
    @Query('uid') uid?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const safePage = Math.max(1, parseInt(page ?? '1', 10) || 1);
    const safeLimit = Math.min(
      100,
      Math.max(1, parseInt(limit ?? '20', 10) || 20),
    );
    return this.favoriteService.findByPage({
      uid,
      page: safePage,
      limit: safeLimit,
    });
  }

  @Post('/page')
  findByPage(@Body() body: FindByPageDto & { uid?: string }) {
    return this.favoriteService.findByPage(body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.favoriteService.remove(+id);
  }

  @Delete('user/:uid')
  removeByUid(@Param('uid') uid: string) {
    return this.favoriteService.removeByUid(uid);
  }
}
