import { IsOptional } from 'class-validator';
import { Work } from '@/work/entities/work.entity';
import { FindByPageDto } from '@/common/typeorm/find.dto';

export class FindWorkByPageDto extends FindByPageDto<Work> {
  @IsOptional()
  domain?: string;

  @IsOptional()
  category?: number;
}
