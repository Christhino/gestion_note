import { ApiProperty } from '@nestjs/swagger';

export class UserCountType {
  @ApiProperty()
  result: number;
}
