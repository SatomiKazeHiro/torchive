import {
  IsInt,
  IsOptional,
  IsObject,
  IsString,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class FindByPageDto<T = any> {
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  page?: number = 1;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  limit?: number = 10;

  @IsString()
  @IsOptional()
  keyword?: string;

  // 排序对象，例如 { name: 'ASC', domain: 'DESC' }
  @IsObject()
  @IsOptional()
  order?: Partial<Record<keyof T, 'ASC' | 'DESC'>>;

  // 随机
  @IsBoolean()
  @IsOptional()
  random?: boolean = false;

  // 是否返回统计数据（文件数、文件大小等）
  @IsBoolean()
  @IsOptional()
  withStats?: boolean = false;
}
