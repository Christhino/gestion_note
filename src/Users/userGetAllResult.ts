import { ApiProperty } from '@nestjs/swagger';

export class User {
  @ApiProperty()
  niveau_person_id: number;
  @ApiProperty()
  'person.id': number;
  @ApiProperty()
  username?: string;
  @ApiProperty()
  group_id?: string;
  @ApiProperty()
  'person.last_name': string;
  @ApiProperty()
  'person.first_name': string;
  @ApiProperty()
  'niveauPerson.from_date': string;
  @ApiProperty()
  'niveauPerson.to_date': any;

}
export class UserResults {
  @ApiProperty()
  totalCount: number;
  @ApiProperty({ type: User, isArray: true })
  result: User[];
}
