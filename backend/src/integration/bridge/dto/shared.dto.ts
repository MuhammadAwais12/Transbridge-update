import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export type OnRampOrOffRamp = 'onramp' | 'offramp';

export function ListDto<T>(itemType: new () => T) {
  class ListDtoClass {
    @IsNumber()
    @IsNotEmpty()
    count: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => itemType)
    data: T[];

    @IsArray()
    @IsOptional()
    extra_data?: any[];
  }

  return ListDtoClass;
}

export enum State {
  AWAITING_FUNDS = 'awaiting_funds',
  IN_REVIEW = 'in_review',
  FUNDS_SCHEDULED = 'funds_scheduled',
  FUNDS_RECEIVED = 'funds_received',
  PAYMENT_SUBMITTED = 'payment_submitted',
  PAYMENT_PROCESSED = 'payment_processed',
  CANCELED = 'canceled',
  UNDELIVERABLE = 'undeliverable',
  RETURNED = 'returned',
  REFUNDED = 'refunded',
}

export enum Currency {
  DAI = 'dai',
  EUR = 'eur',
  EURC = 'eurc',
  MXN = 'mxn',
  PYUSD = 'pyusd',
  USD = 'usd',
  USDB = 'usdb',
  USDC = 'usdc',
  USDT = 'usdt',
}

export enum PaymentRail {
  ACH = 'ach',
  WIRE = 'wire',
  ACH_PUSH = 'ach_push',
  ACH_SAME_DAY = 'ach_same_day',
  ARBITRUM = 'arbitrum',
  AVALANCHE_C_CHAIN = 'avalanche_c_chain',
  BASE = 'base',
  BRIDGE_WALLET = 'bridge_wallet',
  ETHEREUM = 'ethereum',
  OPTIMISM = 'optimism',
  POLYGON = 'polygon',
  SEPA = 'sepa',
  SOLANA = 'solana',
  SPEI = 'spei',
  STELLAR = 'stellar',
  SWIFT = 'swift',
  TRON = 'tron',
}

export class SourceDepositInstructionsDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  to_address?: string;

  @IsEnum(Currency)
  @IsNotEmpty()
  currency: Currency;

  @IsEnum(PaymentRail)
  @IsNotEmpty()
  payment_rail: PaymentRail;

  @IsEnum(PaymentRail, { each: true })
  payment_rails: PaymentRail[];

  @IsString()
  @IsNotEmpty()
  bank_name: string;

  @IsString()
  @IsNotEmpty()
  bank_address: string;

  @IsString()
  @IsNotEmpty()
  bank_beneficiary_name: string;

  @IsString()
  @IsNotEmpty()
  bank_beneficiary_address: string;

  @IsString()
  @IsNotEmpty()
  bank_account_number: string;

  @IsString()
  @IsNotEmpty()
  bank_routing_number: string;
}

export class ReceiptDto {
  @IsString()
  @IsNotEmpty()
  initial_amount: string;

  @IsString()
  @IsNotEmpty()
  developer_fee: string;

  @IsString()
  @IsNotEmpty()
  exchange_fee: string;

  @IsString()
  @IsNotEmpty()
  url: string;

  @IsString()
  @IsNotEmpty()
  gas_fee: string;

  @IsString()
  @IsNotEmpty()
  final_amount: string;

  @IsString()
  @IsNotEmpty()
  destination_tx_hash: string;
}
