import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';

import { Detail } from './entities/detail.entity';
import { DetailService } from './detail.service';
import { CreateDetailDto } from './dto/create-detail.dto';
import { UpdateDetailDto } from './dto/update-detail.dto';
import { FindByPageDto } from '@/common/typeorm/find.dto';

@Controller('details')
export class DetailController {
  constructor(private readonly detailService: DetailService) {}

  @Post()
  create(@Body() createDetailDto: CreateDetailDto) {
    return this.detailService.create(createDetailDto);
  }

  @Get(':hash_id')
  findOne(@Param('hash_id') hash_id: string) {
    return this.detailService.findOne(hash_id);
  }

  @Patch(':hash_id')
  update(
    @Param('hash_id') hash_id: string,
    @Body() updateDetailDto: UpdateDetailDto,
  ) {
    return this.detailService.update(hash_id, updateDetailDto);
  }

  @Delete(':hash_id')
  remove(@Param('hash_id') hash_id: string) {
    return this.detailService.remove(hash_id);
  }

  @Post('/page')
  getPage(@Body() body: FindByPageDto<Detail>) {
    return this.detailService.findByPage(body);
  }
}
