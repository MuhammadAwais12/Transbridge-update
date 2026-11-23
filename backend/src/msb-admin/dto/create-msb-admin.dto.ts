import { IsString, IsEmail, MinLength, MaxLength } from 'class-validator';

export class CreateMsbAdminDto {
  @IsString()
  @MaxLength(254) // RFC 5321 standard email length limit
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(128) // Reasonable password length limit
  password: string;

  @IsString()
  @MaxLength(100) // Reasonable name length
  name: string;

  @IsString()
  @MaxLength(100) // MSB name length limit
  msbName?: string;

  @IsString()
  @MaxLength(255) // Domain name length limit
  msbDomain?: string;
} 