import { ApiProperty } from '@nestjs/swagger';

export class UserType {
  @ApiProperty()
  username: string;
  @ApiProperty()
  group_id: string;
  @ApiProperty()
  gender: string;
  @ApiProperty()
  last_name: string;
  @ApiProperty()
  first_name: string;
  @ApiProperty()
  filiere: string;
  @ApiProperty()
  name: string;
  @ApiProperty()
  phone: string;
}
