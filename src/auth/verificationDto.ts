import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerificationDto {
  @IsEmail()
  @ApiProperty()
  username: string;
}
