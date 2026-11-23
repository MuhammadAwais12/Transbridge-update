import {
  IsString,
  IsUUID,
  IsOptional,
  IsNumber,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAccountDto {
  @ApiProperty() @IsUUID() client_id: string;
  @ApiProperty() @IsUUID() msb_id: string;
  @ApiProperty() @IsString() account_number: string;
  @ApiProperty() @IsString() account_name: string;
  @ApiProperty({ enum: ['current', 'savings', 'multi_currency', 'business'] })
  @IsEnum(['current', 'savings', 'multi_currency', 'business'])
  account_type: 'current' | 'savings' | 'multi_currency' | 'business';
  @ApiProperty() @IsString() currency: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() overdraft_limit?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() minimum_balance?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() monthly_fee?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() interest_rate?: number;
}

export class UpdateAccountStatusDto {
  @ApiProperty({ enum: ['active', 'inactive', 'frozen', 'closed'] })
  @IsEnum(['active', 'inactive', 'frozen', 'closed'])
  status: 'active' | 'inactive' | 'frozen' | 'closed';
}

export class UpdateAccountLimitsDto {
  @ApiPropertyOptional() @IsOptional() @IsNumber() overdraft_limit?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() minimum_balance?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() monthly_fee?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() interest_rate?: number;
}

export class UpdateAccountBalanceDto {
  @ApiPropertyOptional() @IsOptional() @IsNumber() balance?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() available_balance?: number;
}
export class UpdateClientProfileDto {
  @ApiPropertyOptional() @IsString() email?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() first_name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() last_name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone_number?: string;

  @ApiPropertyOptional({ description: 'ISO 8601 date, e.g. 1990-05-21' })
  @IsOptional()
  date_of_birth: string;

  @ApiPropertyOptional() @IsOptional() @IsString() nationality?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() address_1?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() address_2?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() state?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() country?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() postal_code?: string;
}
