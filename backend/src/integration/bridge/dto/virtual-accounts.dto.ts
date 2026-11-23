import { PickType } from '@nestjs/mapped-types';
import { DestinationDto, SourceDto } from './transfers.dto';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  Currency,
  ListDto,
  PaymentRail,
  ReceiptDto,
  SourceDepositInstructionsDto,
  State,
} from './shared.dto';

export class VirtualAccountDestinationDto extends PickType(DestinationDto, [
  'currency',
  'payment_rail',
]) {
  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  bridge_wallet_id?: string;

  @IsOptional()
  @IsString()
  blockchain_memo?: string;
}

export class BridgeCreateVirtualAccountDto {
  @ValidateNested()
  @Type(() => PickType(SourceDto, ['currency']))
  source: Pick<SourceDto, 'currency'> = {} as Pick<SourceDto, 'currency'>;

  @ValidateNested()
  @Type(() => VirtualAccountDestinationDto)
  destination: VirtualAccountDestinationDto =
    new VirtualAccountDestinationDto();

  @IsOptional()
  @IsString()
  developer_fee_percent: string = '0.00';
}

export class VirtualAccountDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsNotEmpty()
  @IsEnum(['activated', 'deactivated'])
  status: 'activated' | 'deactivated';

  @IsString()
  @IsNotEmpty()
  developer_fee_percent: string = '0.00';

  @IsString()
  @IsNotEmpty()
  created_at: string;

  @ValidateNested()
  @Type(() => SourceDepositInstructionsDto)
  source_deposit_instructions: SourceDepositInstructionsDto;

  @ValidateNested()
  @Type(() => VirtualAccountDestinationDto)
  destination: VirtualAccountDestinationDto;

  @IsString()
  @IsNotEmpty()
  customer_id: string;

  // extra fields
  @IsString()
  @IsOptional()
  state?: State;

  @IsOptional()
  @IsString()
  bridge_wallet_balance?: string = '0.00';

  @IsString()
  @IsOptional()
  bridge_wallet_id?: string;
}

export class VirtualAccountListDto extends ListDto(VirtualAccountDto) {}

class HistorySourceDto {
  @IsEnum(PaymentRail)
  @IsNotEmpty()
  payment_rail: PaymentRail;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  sender_name: string;

  @IsString()
  @IsNotEmpty()
  sender_bank_routing_number: string;

  @IsString()
  @IsNotEmpty()
  trace_number: string;
}
export class VirtualAccountHistoryDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsEnum(State)
  @IsNotEmpty()
  type: State;

  @IsEnum(Currency)
  @IsNotEmpty()
  currency: Currency;

  @IsString()
  @IsNotEmpty()
  created_at: string;

  @IsString()
  @IsNotEmpty()
  customer_id: string;

  @IsString()
  @IsNotEmpty()
  virtual_account_id: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  destination_tx_hash?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  deposit_id?: string;

  @ValidateNested()
  @Type(() => ReceiptDto)
  receipt: ReceiptDto;

  @IsString()
  @IsNotEmpty()
  amount: string;

  @IsString()
  @IsNotEmpty()
  developer_fee_amount: string;

  @IsString()
  @IsNotEmpty()
  exchange_fee_amount: string;

  @IsString()
  @IsNotEmpty()
  subtotal_amount: string;

  @IsString()
  @IsNotEmpty()
  gas_fee: string;

  @ValidateNested()
  @Type(() => HistorySourceDto)
  source: HistorySourceDto;

  @IsEnum(PaymentRail)
  @IsNotEmpty()
  destination_payment_rail: PaymentRail;
}

export class VirtualAccountHistoryListDto extends ListDto(
  VirtualAccountHistoryDto,
) {}
export class UpdateDeveloperFeeDto {
  @IsString()
  @IsNotEmpty()
  developer_fee_percent: string;
}
