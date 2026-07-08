import { IsString, IsInt, IsOptional } from 'class-validator';

export class CreateWorkDto {
  @IsString()
  hash_id: string;

  @IsString()
  path: string;

  @IsString()
  work: string;

  @IsString()
  domain: string;

  @IsString()
  category: string;

  @IsInt()
  @IsOptional()
  state?: number;

  @IsInt()
  @IsOptional()
  exist?: number;
}
