import { IsString } from 'class-validator';

export class CreateUserWatchLaterDto {
  @IsString()
  uid: string;

  @IsString()
  work_hash_id: string;
}
