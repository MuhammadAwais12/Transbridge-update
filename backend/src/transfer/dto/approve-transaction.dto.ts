import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ApproveTransactionDto {
  @ApiProperty({
    description: 'Transaction ID to approve',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsString()
  @IsNotEmpty()
  transaction_id: string;

  @ApiProperty({
    description: 'Wallet address for the approval',
    example: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
  })
  @IsString()
  @IsNotEmpty()
  wallet_address: string;

  @ApiProperty({
    description: 'Optional approval reason',
    example: 'Client approved the transfer',
    required: false
  })
  @IsString()
  @IsOptional()
  reason?: string;
} 