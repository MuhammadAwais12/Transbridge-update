import { IsString, IsNotEmpty, IsUUID, IsOptional, MaxLength, IsDateString } from 'class-validator';

export class CreateBeneficiaryDto {
  @IsUUID()
  @IsNotEmpty()
  client_id: string;

  @IsUUID()
  @IsNotEmpty()
  msb_id: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  account_number: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  bank_name: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  bank_code?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  account_type?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  account_class?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  routing_number?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  country: string;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  state?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  city?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  postal_code?: string;

  @IsString()
  @IsNotEmpty()
  type: 'internal' | 'domestic' | 'international';

  @IsString()
  @IsOptional()
  @MaxLength(254)
  email?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  address?: string;

  // BlindPay KYC fields for individual beneficiaries
  @IsString()
  @IsOptional()
  @IsDateString()
  date_of_birth?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  id_document_country?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  id_document_type?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  id_document_front?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  id_document_back?: string;

  // Beneficiary type (individual or business)
  @IsString()
  @IsNotEmpty()
  beneficiary_type: 'individual' | 'business';

  // Business-specific fields
  @IsString()
  @IsOptional()
  @MaxLength(100)
  legal_name?: string;

  @IsString()
  @IsOptional()
  @IsDateString()
  formation_date?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  website?: string;

  @IsOptional()
  owners?: any[];
} 