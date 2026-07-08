import { IsString } from 'class-validator';

export class LoginUserDto {
  @IsString()
  login_name: string;

  @IsString()
  password: string;
}
