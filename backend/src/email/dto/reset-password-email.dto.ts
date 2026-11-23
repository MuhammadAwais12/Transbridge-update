import { IsEmail, IsNotEmpty, IsString, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordEmailDto {
  @ApiProperty({
    description: 'Email address where the reset password email will be sent',
    example: 'user@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Reset password link with token',
    example: 'http://localhost:5173/forgot-password?type=client&token=123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUrl()
  resetLink: string;
}

