import { IsString, IsInt, IsOptional, IsEnum } from 'class-validator';
import { NormalPageTemplate, WorkPageTemplate } from '@/types/enum';

export class UpdateCategoryDto {
  // @IsString()
  // hash_id: string;

  // @IsString()
  // domain: string;

  // @IsString()
  // category: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsOptional()
  @IsEnum(NormalPageTemplate, {
    message: '页面模板只能设置其一: list, grid-card',
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

export type Field = keyof Pick<
  UpdateCategoryDto,
  'name' | 'page_template' | 'work_page_template' | 'state' | 'exist'
>;
