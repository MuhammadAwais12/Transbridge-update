import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ description: 'Current password' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Current password must be at least 6 characters' })
  @MaxLength(128, { message: 'Current password must not exceed 128 characters' })
  currentPassword: string;

  @ApiProperty({ description: 'New password' })
  @IsString()
  @IsNotEmpty()
  @MinLength(12, { message: 'New password must be at least 12 characters' })
  @MaxLength(128, { message: 'New password must not exceed 128 characters' })
  newPassword: string;
} 