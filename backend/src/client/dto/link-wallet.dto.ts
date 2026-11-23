import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class LinkWalletDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(42, { message: 'Wallet address must not exceed 42 characters' })
  wallet_address: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50, { message: 'Wallet network must not exceed 50 characters' })
  wallet_network: string;
} 