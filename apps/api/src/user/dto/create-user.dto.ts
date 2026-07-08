import { IsString, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsOptional()
  uid?: string;

  @IsString()
  login_name: string;

  @IsString()
  password: string;

  @IsString()
  @IsOptional()
  user_name?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  avatar?: string;
}
