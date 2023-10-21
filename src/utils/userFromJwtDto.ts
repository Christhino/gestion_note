import { IsNotEmpty } from 'class-validator';

export class UserFromJwtDto {
  @IsNotEmpty()
  group_id: string;
  @IsNotEmpty()
  sub: number;
  @IsNotEmpty()
  username: string;
  @IsNotEmpty()
  iat: number;
  @IsNotEmpty()
  exp: number;
}
