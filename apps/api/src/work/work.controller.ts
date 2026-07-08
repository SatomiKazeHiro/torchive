import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';

import { WorkService } from './work.service';
import { CreateWorkDto } from './dto/create-work.dto';
import { UpdateWorkDto } from './dto/update-work.dto';
import { FindWorkByPageDto } from '@/common/typeorm/find.work.dto';

@Controller('works')
export class WorkController {
  constructor(private readonly workService: WorkService) {}

  @Post()
  create(@Body() createWorkDto: CreateWorkDto) {
    return this.workService.create(createWorkDto);
  }

  @Get(':hash_id')
  findOne(@Param('hash_id') hash_id: string) {
    return this.workService.findOne(hash_id);
  }

  @Patch(':hash_id')
  update(
    @Param('hash_id') hash_id: string,
    @Body() updateWorkDto: UpdateWorkDto,
  ) {
    return this.workService.update(hash_id, updateWorkDto);
  }

  @Delete(':hash_id')
  remove(@Param('hash_id') hash_id: string) {
    return this.workService.remove(hash_id);
  }

  @Post('/page')
  getPage(@Body() body: FindWorkByPageDto) {
    return this.workService.findByPage(body);
  }
}
