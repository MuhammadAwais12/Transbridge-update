import { IsString, IsEnum, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum PaymentRail {
  ACH = 'ach',
  DOMESTIC_WIRE = 'domestic_wire',
  INTERNATIONAL_WIRE = 'international_wire',
  RTP = 'rtp',
}

export class CreateVirtualAccountDto {
  @ApiProperty({ description: 'Client ID' })
  @IsUUID()
  clientId: string;

  @ApiProperty({ description: 'Payment rail type', enum: PaymentRail })
  @IsEnum(PaymentRail)
  paymentRail: PaymentRail;

  @ApiProperty({ description: 'Token type', default: 'USDC' })
  @IsString()
  token?: string;

  @ApiProperty({ description: 'Blockchain wallet ID (BlindPay wallet ID)', required: true })
  @IsString()
  blockchainWalletId: string;

  @ApiProperty({ description: 'Account name', required: false })
  @IsString()
  accountName?: string;

  @ApiProperty({ description: 'Account description', required: false })
  @IsString()
  description?: string;
} 