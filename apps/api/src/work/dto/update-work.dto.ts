import { IsNumber, IsOptional } from 'class-validator';

export class UpdateWorkDto {
  // @IsString()
  // path: string;

  // @IsString()
  // work: string;

  // @IsString()
  // domain: string;

  // @IsString()
  // category: string;

  @IsNumber()
  @IsOptional()
  state?: number;

  @IsNumber()
  @IsOptional()
  exist?: number;
}

export type Field = keyof Pick<
  UpdateWorkDto,
  // 'path' | 'work' | 'domain' | 'category' |
  'state' | 'exist'
>;
