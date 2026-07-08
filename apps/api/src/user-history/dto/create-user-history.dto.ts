import { IsString, IsOptional } from 'class-validator';

export class CreateUserHistoryDto {
  @IsString()
  uid: string;

  @IsString()
  work_hash_id: string;

  @IsString()
  @IsOptional()
  params?: string;
}
