import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ResetWalletDto {
  @ApiProperty({ description: 'Client ID to reset wallet for' })
  @IsString()
  @IsNotEmpty()
  client_id: string;

  @ApiPropertyOptional({ description: 'Reason for wallet reset (for audit purposes)' })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Reason must not exceed 500 characters' })
  reason?: string;

  @ApiPropertyOptional({ description: 'Support agent ID or identifier' })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Support agent ID must not exceed 100 characters' })
  support_agent_id?: string;
} 