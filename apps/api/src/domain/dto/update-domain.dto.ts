import { IsString, IsInt, IsOptional, IsEnum } from 'class-validator';
import { NormalPageTemplate } from '@/types/enum';

export class UpdateDomainDto {
  // @IsString()
  // domain: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsOptional()
  @IsEnum(NormalPageTemplate, {
    message: '页面模板只能设置其一: list, grid-card',
  })
  page_template?: NormalPageTemplate;

  @IsInt()
  @IsOptional()
  state?: number;

  @IsInt()
  @IsOptional()
  exist?: number;
}

export type Field = keyof Pick<
  UpdateDomainDto,
  'name' | 'page_template' | 'state' | 'exist'
>;
