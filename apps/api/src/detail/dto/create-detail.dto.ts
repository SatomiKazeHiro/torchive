import { IsString, IsInt, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { Detail } from '../entities/detail.entity';

export class CreateDetailDto {
  @IsString()
  hash_id: string;

  @IsString()
  domain: string;

  @IsString()
  category: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  cover?: string;

  @IsString()
  @IsOptional()
  @Transform(({ obj }: { obj: Detail }) => obj.title ?? obj.name)
  title?: string;

  @IsString()
  @IsOptional()
  intro?: string;

  @IsInt()
  amount: number;

  @IsInt()
  size: number;

  @IsString()
  @IsOptional()
  create_time?: string;

  @IsString()
  @IsOptional()
  update_time?: string;

  @IsInt()
  has_section: number;

  @IsInt()
  is_orphan: number;

  @IsString()
  entities_json: string;
}
