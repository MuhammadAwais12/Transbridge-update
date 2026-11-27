import {
  IsString,
  IsEmail,
  MinLength,
  MaxLength,
  IsOptional,
  ValidateIf,
} from 'class-validator';

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

  // Optional, but required when msbDomain is sent: msbDomain creates an MSB row
  // and msb.name is NOT NULL.
  @ValidateIf(
    (o: CreateMsbAdminDto) =>
      o.msbName !== undefined || o.msbDomain !== undefined,
  )
  @IsString()
  @MaxLength(100) // MSB name length limit
  msbName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255) // Domain name length limit
  msbDomain?: string;
}
