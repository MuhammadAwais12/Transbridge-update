import { IsString, IsNotEmpty, IsObject, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class TransferCreateAccountDto {
  @IsString()
  @IsNotEmpty()
  receiver_id: string;

  @IsString()
  @IsNotEmpty()
  client_id: string;

  @IsString()
  @IsNotEmpty()
  msb_id: string;

  @IsString()
  @IsNotEmpty()
  account_name: string;

  @IsString()
  @IsNotEmpty()
  account_type: string;

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  initial_balance?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  overdraft_limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minimum_balance?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  monthly_fee?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  interest_rate?: number;

  @IsString()
  @IsOptional()
  pin_number?: string;

  @IsObject()
  bankAccountData: any; // Should match BlindPay API payload for the selected payment rail
} 