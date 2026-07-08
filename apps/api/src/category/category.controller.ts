import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';

import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { FindCategoryByPageDto } from '@/common/typeorm/find.category.dto';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoryService.create(createCategoryDto);
  }

  @Get(':hash_id')
  findOne(@Param('hash_id') hash_id: string) {
    return this.categoryService.findOne(hash_id);
  }

  @Patch(':hash_id')
  update(
    @Param('hash_id') hash_id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoryService.update(hash_id, updateCategoryDto);
  }

  @Delete(':hash_id')
  remove(@Param('hash_id') hash_id: string) {
    return this.categoryService.remove(hash_id);
  }

  @Post('/page')
  getPage(@Body() body: FindCategoryByPageDto) {
    return this.categoryService.findByPage(body);
  }
}
