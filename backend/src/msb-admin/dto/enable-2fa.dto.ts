import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class Enable2faDto {
  @IsString()
  @Matches(/^(\d{6}|[A-Z0-9]{8})$/)
  otp: string; // 6-digit TOTP or 8-char backup code
}
