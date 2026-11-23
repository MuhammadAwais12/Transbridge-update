import { OmitType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import {
  Currency,
  ListDto,
  PaymentRail,
  SourceDepositInstructionsDto,
  State,
} from './shared.dto';

export class SourceDto {
  @IsString()
  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @IsString()
  @IsOptional()
  @IsEnum(PaymentRail)
  payment_rail?: PaymentRail;

  @IsOptional()
  @IsString()
  external_account_id?: string;

  @IsOptional()
  @IsString()
  bridge_wallet_id?: string;

  @IsOptional()
  @IsString()
  from_address?: string;
}

export class DestinationDto extends OmitType(SourceDto, ['from_address']) {
  @IsOptional()
  @IsString()
  to_address?: string;

  @IsOptional()
  @IsString()
  wire_message?: string;

  @IsOptional()
  @IsString()
  sepa_reference?: string;

  @IsOptional()
  @IsString()
  ach_reference?: string;
}

export class FeatureDto {
  @IsOptional()
  @IsBoolean()
  flexible_amount?: boolean = true;

  @IsOptional()
  @IsBoolean()
  static_template?: boolean = true;

  @IsOptional()
  @IsBoolean()
  allow_any_from_address?: boolean = true;
}

export class CreateTransferDto {
  @IsString()
  @IsNotEmpty()
  on_behalf_of: string;

  @ValidateNested()
  @Type(() => SourceDto)
  source: SourceDto;

  @ValidateNested()
  @Type(() => DestinationDto)
  destination: DestinationDto;

  @IsOptional()
  @IsString()
  amount?: string;

  @IsOptional()
  @IsString()
  developer_fee?: string;

  @IsOptional()
  @IsString()
  developer_fee_percent?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => FeatureDto)
  features?: FeatureDto;

  @IsOptional()
  @IsString()
  client_reference_id?: string;
}

export class TransferDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  amount: string;

  @IsEnum(Currency)
  @IsNotEmpty()
  currency: Currency;

  @IsString()
  @IsNotEmpty()
  on_behalf_of: string;

  @IsString()
  @IsNotEmpty()
  developer_fee: string;

  @ValidateNested()
  @Type(() => SourceDto)
  source: SourceDto;
  source_deposit_instructions: SourceDepositInstructionsDto;

  @ValidateNested()
  @Type(() => DestinationDto)
  destination: DestinationDto;

  @IsEnum(State)
  @IsNotEmpty()
  state: State;

  @IsObject()
  @IsNotEmpty()
  receipt: Record<string, string>;

  @IsString()
  @IsNotEmpty()
  created_at: string;

  @IsString()
  @IsNotEmpty()
  updated_at: string;

  @ValidateNested()
  @Type(() => SourceDepositInstructionsDto)
  features: FeatureDto;

  @IsString()
  @IsOptional()
  client_reference_id?: string;
}

export class TransferListDto extends ListDto(TransferDto) {}
