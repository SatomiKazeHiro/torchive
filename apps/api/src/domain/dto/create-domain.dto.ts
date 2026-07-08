import { IsString, IsInt, IsOptional, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { Domain } from '../entities/domain.entity';
import { NormalPageTemplate } from '@/types/enum';

export class CreateDomainDto {
  @IsString()
  domain: string;

  @IsString()
  @Transform(({ obj }: { obj: Domain }) => obj.name ?? obj.domain)
  name: string;

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
