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
  findAll(@Query('uid') uid?: string) {
    return this.watchLaterService.findByPage({ uid, page: 1, limit: 1000 });
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
