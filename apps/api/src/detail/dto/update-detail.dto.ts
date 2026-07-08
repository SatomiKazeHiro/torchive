import { PartialType } from '@nestjs/mapped-types';
import { CreateDetailDto } from './create-detail.dto';

export class UpdateDetailDto extends PartialType(CreateDetailDto) {}

export type Field = keyof Pick<
  CreateDetailDto,
  | 'hash_id'
  | 'name'
  | 'domain'
  | 'category'
  | 'cover'
  | 'title'
  | 'intro'
  | 'amount'
  | 'size'
  | 'has_section'
  | 'is_orphan'
  | 'create_time'
  | 'update_time'
  | 'entities_json'
>;
