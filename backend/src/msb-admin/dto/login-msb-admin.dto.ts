import { IsString, MinLength, MaxLength, IsOptional, Matches } from 'class-validator';

export class LoginMsbAdminDto {
  @IsString()
  @MaxLength(254) // RFC 5321 standard email length limit
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(128) // Reasonable password length limit
  password: string;

  @IsOptional()
  @IsString()
  @Matches(/^(\d{6}|[A-Z0-9]{8})$/)
  otp?: string; // 6-digit TOTP or 8-char backup code
}
