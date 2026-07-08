import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
} from '@nestjs/common';

import { UserHistoryService } from './user-history.service';
import { CreateUserHistoryDto } from './dto/create-user-history.dto';
import { FindByPageDto } from '@/common/typeorm/find.dto';

@Controller('user-histories')
export class UserHistoryController {
  constructor(private readonly historyService: UserHistoryService) {}

  @Post()
  create(@Body() dto: CreateUserHistoryDto) {
    return this.historyService.create(dto);
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
    return this.historyService.findByPage({
      uid,
      page: safePage,
      limit: safeLimit,
    });
  }

  @Post('/page')
  findByPage(@Body() body: FindByPageDto & { uid?: string }) {
    return this.historyService.findByPage(body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.historyService.remove(+id);
  }

  @Delete('user/:uid')
  removeByUid(@Param('uid') uid: string) {
    return this.historyService.removeByUid(uid);
  }
}
