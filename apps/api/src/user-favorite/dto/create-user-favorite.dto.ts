import { IsString } from 'class-validator';

export class CreateUserFavoriteDto {
  @IsString()
  uid: string;

  @IsString()
  work_hash_id: string;
}
