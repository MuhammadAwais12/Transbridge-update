// Request DTOs for External Accounts (loosely typed to match Bridge API; we pass-through responses)
export interface GetAllExternalAccountsQueryDto {
  limit?: number;
  starting_after?: string;
  ending_before?: string;
}

export interface BaseExternalAccountDto {
  id: string;
  account_owner_type: 'individual' | 'business';
  first_name: string;
  account_type: string;
  currency: string;
  account_owner_name: string;
  bank_name: string;
  last_4: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface USExternalAccountDto extends BaseExternalAccountDto {
  account_type: 'us';
  currency: 'usd';
  beneficiary_address_valid: boolean;
  account: {
    last_4: string;
    routing_number: string;
    checking_or_savings: 'checking' | 'savings';
  };
}

export interface EURExternalAccountDto extends BaseExternalAccountDto {
  account_type: 'iban';
  currency: 'eur';
  iban: {
    last_4: string;
    bic: string;
    country: string;
  };
}

export type ExternalAccountDto = USExternalAccountDto | EURExternalAccountDto;

export interface CreateExternalAccountDto {
  currency?: string;
  bank_name?: string;
  account_owner_name?: string;
  account_number?: string;
  routing_number?: string;
  account_type?: string; // e.g., 'us'
  iban?: {
    account_number?: string;
    bic?: string;
    country?: string;
  };
  account?: {
    account_number?: string;
    routing_number?: string;
    checking_or_savings?: 'checking' | 'savings';
  };
  swift?: {
    account?: {
      account_number?: string;
      bic?: string;
      country?: string;
    };
    address?: {
      street_line_1?: string;
      street_line_2?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country?: string;
    };
    category?: string;
    purpose_of_funds?: string[];
    short_business_description?: string;
  };
  clabe?: {
    account_number?: string;
  };
  account_owner_type?: 'individual' | 'business';
  first_name?: string;
  last_name?: string;
  business_name?: string;
  address?: {
    street_line_1?: string;
    street_line_2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
}

export interface UpdateExternalAccountDto {
  address?: {
    street_line_1?: string;
    street_line_2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  account?: {
    checking_or_savings?: 'checking' | 'savings';
    routing_number?: string;
  };
}
