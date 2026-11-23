import { IsString, IsOptional, IsNumber, IsIn, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MSBTransactionListDto {
  @ApiProperty({ description: 'MSB ID to fetch transactions for' })
  @IsString()
  msb_id: string;

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

  @ApiPropertyOptional({ 
    description: 'Filter by transaction status',
    enum: ['pending', 'approved', 'rejected', 'completed', 'failed']
  })
  @IsOptional()
  @IsString()
  @IsIn(['pending', 'approved', 'rejected', 'completed', 'failed'])
  status?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by transaction type',
    enum: ['credit', 'debit', 'transfer', 'payment', 'deposit', 'withdrawal', 'fee']
  })
  @IsOptional()
  @IsString()
  @IsIn(['credit', 'debit', 'transfer', 'payment', 'deposit', 'withdrawal', 'fee'])
  type?: string;
} 