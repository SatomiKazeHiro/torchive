import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
} from '@nestjs/common';

import { UserWatchLaterService } from './user-watch-later.service';
import { CreateUserWatchLaterDto } from './dto/create-user-watch-later.dto';
import { FindByPageDto } from '@/common/typeorm/find.dto';

@Controller('user-watch-laters')
export class UserWatchLaterController {
  constructor(private readonly watchLaterService: UserWatchLaterService) {}

  @Post()
  create(@Body() dto: CreateUserWatchLaterDto) {
    return this.watchLaterService.create(dto);
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
    return this.watchLaterService.findByPage({
      uid,
      page: safePage,
      limit: safeLimit,
    });
  }

  @Post('/page')
  findByPage(@Body() body: FindByPageDto & { uid?: string }) {
    return this.watchLaterService.findByPage(body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.watchLaterService.remove(+id);
  }

  @Delete('user/:uid')
  removeByUid(@Param('uid') uid: string) {
    return this.watchLaterService.removeByUid(uid);
  }
}
