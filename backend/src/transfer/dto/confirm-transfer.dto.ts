import { IsString, IsNotEmpty, IsBoolean, IsNumber, IsUUID, IsOptional } from 'class-validator';

export class ConfirmTransferDto {
  @IsUUID()
  @IsNotEmpty()
  account_id: string;

  @IsUUID()
  @IsNotEmpty()
  client_id: string;

  @IsUUID()
  @IsNotEmpty()
  msb_id: string;

  @IsString()
  @IsNotEmpty()
  transfer_type: 'internal' | 'domestic' | 'international';

  @IsUUID()
  @IsOptional()
  destination_account_id?: string;

  @IsUUID()
  @IsOptional()
  beneficiary_id?: string;

  @IsString()
  @IsNotEmpty()
  bank_account_id: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsBoolean()
  cover_fees: boolean;

  @IsString()
  @IsNotEmpty()
  payment_method: string;

  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsNotEmpty()
  network: string;

  @IsString()
  @IsNotEmpty()
  payin_quote_id: string;

  @IsString()
  @IsNotEmpty()
  payout_quote_id: string;

  @IsOptional()
  payout_quote_data?: any; // Store the complete payout quote response for token approval
} 