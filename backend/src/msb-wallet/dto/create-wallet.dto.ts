import { IsString, IsNotEmpty, IsOptional, IsBoolean, MaxLength } from 'class-validator';

export class CreateWalletDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(36, { message: 'Client ID must not exceed 36 characters' })
  client_id: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100, { message: 'Wallet name must not exceed 100 characters' })
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50, { message: 'Network must not exceed 50 characters' })
  network: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(56, { message: 'Address must not exceed 56 characters' })
  address: string;

  @IsBoolean()
  @IsOptional()
  is_account_abstraction?: boolean;
} 