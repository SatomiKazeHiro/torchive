import { IsString, IsInt, IsOptional, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { NormalPageTemplate, WorkPageTemplate } from '@/types/enum';
import { Category } from '../entities/category.entity';

export class CreateCategoryDto {
  @IsString()
  hash_id: string;

  @IsString()
  domain: string;

  @IsString()
  category: string;

  @IsString()
  @Transform(({ obj }: { obj: Category }) => obj.name ?? obj.category)
  name: string;

  @IsOptional()
  @IsEnum(NormalPageTemplate, {
    message: 'page_template must be one of: list, grid-card',
  })
  page_template?: NormalPageTemplate;

  @IsOptional()
  @IsEnum(WorkPageTemplate, {
    message:
      'work_page_template must be one of: video, manga, album, music, mixture, ebook',
  })
  work_page_template?: WorkPageTemplate;

  @IsInt()
  @IsOptional()
  state?: number;

  @IsInt()
  @IsOptional()
  exist?: number;
}
