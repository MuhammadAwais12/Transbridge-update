import {
  IsString,
  MinLength,
  IsOptional,
  IsDateString,
  MaxLength,
  IsArray,
  ValidateNested,
  IsNumber,
  IsIn,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class OwnerDto {
  @ApiProperty()
  @IsString()
  @MaxLength(50)
  first_name: string;

  @ApiProperty()
  @IsString()
  @MaxLength(50)
  last_name: string;

  @ApiProperty()
  @IsDateString()
  date_of_birth: string;

  @ApiProperty()
  @IsNumber()
  ownership_percentage: number;

  @ApiProperty()
  @IsString()
  @MaxLength(255)
  address_line_1: string;

  @ApiProperty()
  @IsString()
  @MaxLength(100)
  city: string;

  @ApiProperty()
  @IsString()
  @MaxLength(100)
  state_province_region: string;

  @ApiProperty()
  @IsString()
  @MaxLength(100)
  country: string;

  @ApiProperty()
  @IsString()
  @MaxLength(20)
  postal_code: string;

  @ApiProperty()
  @IsString()
  @IsIn(['beneficial_owner', 'beneficial_controlling', 'controlling_person'])
  role: string;

  @ApiProperty()
  @IsString()
  @MaxLength(100)
  tax_id: string;

  @ApiProperty()
  @IsString()
  @MaxLength(100)
  id_doc_country: string;

  @ApiProperty()
  @IsString()
  @MaxLength(100)
  id_doc_type: string;

  @ApiProperty()
  @IsString()
  @MaxLength(500)
  id_doc_front_file: string;
}

export class CreateClientDto {
  @ApiProperty()
  @IsString()
  @MaxLength(254) // RFC 5321 standard email length limit
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(12)
  @MaxLength(128) // Reasonable password length limit
  password: string;

  // Optional display name; no validation to avoid name-related errors
  @ApiPropertyOptional()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_msb?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  developer_fee_percent?: string;

  // Optional first name; no validation to avoid first_name-related errors
  @ApiPropertyOptional()
  @IsOptional()
  first_name?: string;

  // Optional last name; no validation to avoid last_name-related errors
  @ApiPropertyOptional()
  @IsOptional()
  last_name?: string;

  @ApiProperty({ description: 'MSB ID (snake_case only)' })
  @IsString()
  @MaxLength(36) // UUID length
  msb_id: string;

  @ApiProperty({ description: 'Client type' })
  @IsString()
  @IsIn(['individual', 'business'])
  @MaxLength(20) // Reasonable client type length
  client_type: 'individual' | 'business';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200) // Reasonable legal name length
  legal_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200) // Reasonable DBA length
  doing_business_as?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  formation_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255) // URL length limit
  website?: string;

  @ApiPropertyOptional({ type: [OwnerDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OwnerDto)
  ubos?: OwnerDto[];

  @ApiPropertyOptional({ type: [OwnerDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OwnerDto)
  shareholders?: OwnerDto[];

  @ApiPropertyOptional({ type: [OwnerDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OwnerDto)
  owners?: OwnerDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(45) // IPv4/IPv6 address length
  ip_address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500) // URL length limit
  image_url?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20) // Phone number length
  phone_number?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50) // Document type length
  source_of_funds_doc_type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500) // File path/URL length
  source_of_funds_doc_file?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500) // File path/URL length
  individual_holding_doc_front_file?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100) // Purpose length
  purpose_of_transactions?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100) // Purpose length
  purpose_of_transactions_explanation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50) // External ID length
  external_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255) // Address 1 length
  address_1?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255) // Address 2 length
  address_2?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100) // City length
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100) // State length
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20) // Postal code length
  postal_code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100) // ID document country length
  id_document_country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100) // ID document type length
  id_document_type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500) // ID document front file path/URL
  id_document_front?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500) // ID document back file path/URL
  id_document_back?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100) // Proof of address type length
  proof_of_address_type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500) // Proof of address document file path/URL
  proof_of_address_document?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500) // Company formation document file path/URL
  company_formation_document?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500) // Incorporation doc file path/URL
  incorporation_doc_file?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500) // Proof of ownership document file path/URL
  proof_of_ownership_document?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500) // Proof of ownership doc file path/URL
  proof_of_ownership_doc_file?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100) // KYC type length
  kyc_type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100) // Nationality length
  nationality?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100) // Occupation length
  occupation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100) // Source of funds length
  source_of_funds?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100) // Annual income range length
  annual_income_range?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100) // Tax ID length
  tax_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100) // Country length
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100) // TOS ID length
  tos_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100) // Date of birth length
  date_of_birth?: string;
}
