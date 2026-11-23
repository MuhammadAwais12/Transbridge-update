// Common types for payment API integrations

export interface PaymentProvider {
  name: string;
  isActive: boolean;
  apiKey?: string;
  apiSecret?: string;
  baseUrl: string;
  supportedCurrencies: string[];
  supportedCountries: string[];
  webhookUrl?: string;
}

// Payin Transaction Types
export interface TrackingStep {
  step: string;
  status: string;
  external_id?: string;
  completed_at?: string;
  transaction_hash?: string;
  provider_name?: string;
}

export interface BlindPayBankDetails {
  routing_number: string;
  account_number: string;
  account_type: string;
  beneficiary: {
    name: string;
    address_line_1: string;
    address_line_2: string;
  };
  receiving_bank: {
    name: string;
    address_line_1: string;
    address_line_2: string;
  };
  swift_bic_code: string;
  ach: {
    routing_number: string;
    account_number: string;
  };
  wire: {
    routing_number: string;
    account_number: string;
  };
  rtp: {
    routing_number: string;
    account_number: string;
  };
}

export interface PayinTransaction {
  receiver_id: string;
  id: string;
  pix_code: string | null;
  memo_code: string | null;
  clabe: string | null;
  status: string;
  payin_quote_id: string;
  instance_id: string;
  tracking_transaction: TrackingStep;
  tracking_payment: TrackingStep;
  tracking_complete: TrackingStep;
  tracking_partner_fee: TrackingStep;
  created_at: string;
  updated_at: string;
  image_url: string | null;
  first_name: string;
  last_name: string;
  legal_name: string | null;
  type: string;
  payment_method: string;
  sender_amount: number;
  receiver_amount: number;
  token: string;
  partner_fee_amount: number;
  commercial_quotation: number;
  blindpay_quotation: number;
  currency: string;
  billing_fee: number | null;
  name: string;
  address: string;
  network: string;
  total_fee_amount: number;
  blindpay_bank_details: BlindPayBankDetails;
}

export interface PaymentRequest {
  amount: number;
  currency: string;
  sourceAccountId: string;
  destinationAccountId?: string;
  beneficiaryId?: string;
  reference: string;
  description: string;
  paymentMethod?: string;
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  success: boolean;
  paymentId?: string;
  providerReference?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  statusMessage?: string;
  estimatedCompletionTime?: string;
  fee?: number;
  exchangeRate?: number;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface AccountRequest {
  clientId: string;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  nationality: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  idType: 'passport' | 'driver_license' | 'national_id';
  idNumber: string;
  phoneNumber: string;
  occupation: string;
  sourceOfFunds: string;
  businessName?: string;
  businessType?: string;
  taxId?: string;
  documents?: {
    type: string;
    fileUrl: string;
    fileName: string;
    mimeType: string;
  }[];
}

export interface AccountResponse {
  success: boolean;
  accountId?: string;
  providerReference?: string;
  status: 'pending' | 'approved' | 'rejected' | 'requires_documents';
  statusMessage?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface TransactionRecord {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  currency: string;
  description: string;
  status: string;
  createdAt: string;
  completedAt?: string;
  reference: string;
  counterparty?: {
    name: string;
    accountNumber?: string;
    bankName?: string;
    country?: string;
  };
  metadata?: Record<string, any>;
}

export interface BalanceResponse {
  accountId: string;
  currency: string;
  balance: number;
  availableBalance: number;
  pendingBalance?: number;
  lastUpdated: string;
}

export interface StatementRequest {
  accountId: string;
  startDate: string;
  endDate: string;
  format: 'pdf' | 'csv' | 'json';
  includeMetadata?: boolean;
  deliveryEmail?: string;
}

export interface StatementResponse {
  success: boolean;
  statementId?: string;
  status: 'generating' | 'available' | 'failed';
  downloadUrl?: string;
  error?: {
    code: string;
    message: string;
  };
}

export interface WebhookEvent {
  id: string;
  type: string;
  createdAt: string;
  data: any;
  signature?: string;
}