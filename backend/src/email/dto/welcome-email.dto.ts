import { IsEmail, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class WelcomeEmailDto {
  @ApiProperty({
    description: 'Full name of the user (will be split to get first and last name)',
    example: 'John Doe',
  })
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @ApiProperty({
    description: 'Email address of the user',
    example: 'john.doe@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Account ID of the user',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID()
  accountId: string;

  @ApiProperty({
    description: 'Temporary password for the user to log in',
    example: 'TempPass123!',
  })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty({
    description: 'Login URL for the user to access their account',
    example: 'https://dashboard.originalaccounts.com/login',
  })
  @IsNotEmpty()
  @IsString()
  loginUrl: string;
} 