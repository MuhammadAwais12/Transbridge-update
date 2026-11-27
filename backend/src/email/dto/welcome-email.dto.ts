import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WelcomeEmailDto {
  @ApiProperty({
    description:
      'Full name of the user (will be split to get first and last name)',
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

  @ApiPropertyOptional({
    description: 'Temporary password for the user to log in',
    example: 'TempPass123!',
  })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiProperty({
    description: 'Login URL for the user to access their account',
    example: 'https://dashboard.example.com/login',
  })
  @IsNotEmpty()
  @IsString()
  loginUrl: string;
} 