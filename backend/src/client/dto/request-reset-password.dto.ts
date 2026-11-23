import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestResetPasswordDto {
  @ApiProperty({
    description: 'Email address of the user requesting password reset',
    example: 'user@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;
}

