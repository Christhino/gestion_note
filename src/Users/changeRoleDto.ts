import { ApiProperty } from '@nestjs/swagger';

export enum Role {
  AD,
  EN,
  SC,
  ET 
}
export class ChangeRoleDto {
  @ApiProperty()
  role_id: string;
}
