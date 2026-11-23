import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateFeeExternalAccountDto {
  @IsString()
  @IsNotEmpty()
  bank_name: string;

  @IsString()
  @IsNotEmpty()
  account_owner_type: 'individual' | 'business';

  @IsString()
  @IsOptional()
  first_name?: string;

  @IsString()
  @IsOptional()
  last_name?: string;

  @IsString()
  @IsOptional()
  business_name?: string;

  @IsString()
  @IsNotEmpty()
  routing_number: string;

  @IsString()
  @IsNotEmpty()
  account_number: string;

  @IsString()
  @IsNotEmpty()
  account_type: 'checking' | 'savings';

  @IsString()
  @IsNotEmpty()
  street_line_1: string;

  @IsString()
  @IsOptional()
  street_line_2?: string;

  @IsString()
  @IsNotEmpty()
  country: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsNotEmpty()
  postal_code: string;
}

export class UpdateFeeExternalAccountDto extends CreateFeeExternalAccountDto {}
