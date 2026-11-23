import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ClientTransactionListDto {
  @ApiProperty({ description: 'Client ID to fetch transactions for' })
  @IsString()
  client_id: string;

  @ApiPropertyOptional({ description: 'Page number for pagination', default: 1, minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of transactions per page', default: 50, minimum: 1, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 50;
}


export class ClientTransactionPayinTrackDTO {
  receiver_id: string;
  id: string;
  pix_code?: string;
  memo_code?: string;
  clabe?: string;
  status: string;
  payin_quote_id: string;
  instance_id: string;
  tracking_transaction: {
    step: string;
    status: string;
    external_id?: string;
    completed_at?: string;
    sender_name?: string;
    sender_tax_id?: string;
    sender_bank_code?: string;
    sender_account_number?: string;
  };
  tracking_payment: {
    step: string;
    provider_name?: string;
    completed_at?: string;
  };
  tracking_complete: {
    step: string;
    transaction_hash?: string;
    completed_at?: string;
  };
  tracking_partner_fee: {
    step: string;
    transaction_hash?: string;
    completed_at?: string;
  };
  created_at: string;
  updated_at: string;
  image_url: string;
  first_name?: string;
  last_name?: string;
  legal_name?: string;
  type: string;
  payment_method: string;
  sender_amount: number;
  receiver_amount: number;
}