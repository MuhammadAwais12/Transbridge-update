import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Currency, ListDto } from './shared.dto';
import { Type } from 'class-transformer';

export class WalletDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsNotEmpty()
  @IsEnum(['base', 'solana'])
  chain: 'base' | 'solana';

  @IsString()
  @IsNotEmpty()
  created_at: string;

  @IsString()
  @IsNotEmpty()
  updated_at: string;
}

export class WalletListDto extends ListDto(WalletDto) {}

export class BalanceDto {
  @IsString()
  @IsNotEmpty()
  balance: string;

  @IsNotEmpty()
  @IsEnum(Currency)
  currency: Currency;

  @IsNotEmpty()
  @IsEnum(['base', 'solana'])
  chain: 'base' | 'solana';

  @IsString()
  @IsNotEmpty()
  contract_address: string;
}

export class WalletBalanceDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  created_at: string;

  @IsString()
  @IsNotEmpty()
  updated_at: string;

  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => BalanceDto)
  balances: BalanceDto[];
}
