import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
export class CustomerDto {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  status:
    | 'active'
    | 'awaiting_questionnaire'
    | 'awaiting_ubo'
    | 'incomplete'
    | 'offboarded'
    | 'paused'
    | 'rejected'
    | 'under_review'
    | 'not_started';
  type: 'individual' | 'business';
  has_accepted_terms_of_service: boolean;
  address: {
    street_line_1: string;
    street_line_2?: string;
    city: string;
    postal_code: string;
    state: string;
    country: string;
  };
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}

export class ResidentialAddressDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  street_line_1: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  street_line_2?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  postal_code?: string;
}

export class UpdateCustomerDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  first_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  last_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  birth_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nationality?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => ResidentialAddressDto)
  residential_address?: ResidentialAddressDto;
}
