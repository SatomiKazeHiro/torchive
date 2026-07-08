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
  findAll(@Query('uid') uid?: string) {
    return this.historyService.findByPage({ uid, page: 1, limit: 1000 });
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
