export interface User {
  id: string;
  email: string;
  name: string;
  role: 'msb_admin' | 'account_holder';
  msbId?: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  clientId?: string;
  passwordChanged?: boolean;
  wallet_address?: string; // Linked wallet address
  wallet_network?: string; // Network of linked wallet
  blindpay_wallet_id?: string; // BlindPay wallet ID
}

export interface MSB {
  id: string;
  name: string;
  domain: string;
  logo?: string;
  branding: BrandingConfig;
  isActive: boolean;
  createdAt: string;
  settings: MSBSettings;
}

export interface BrandingConfig {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl?: string;
  theme: 'light' | 'dark';
  customCss?: string;
}

export interface MSBSettings {
  requireTransactionApproval: boolean;
  approvalThreshold: number;
  allowInternationalTransfers: boolean;
  mfaRequired: boolean;
  sessionTimeout: number;
}

export interface AccountHolder {
  id: string;
  msbId: string;
  personalInfo: PersonalInfo;
  kycStatus: 'pending' | 'approved' | 'rejected' | 'requires_documents';
  accounts: Account[];
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface PersonalInfo {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  idNumber: string;
  idType: 'passport' | 'driver_license' | 'national_id';
  phoneNumber: string;
  email: string;
  address: Address;
  occupation: string;
  sourceOfFunds: string;
  documents: Document[];
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Document {
  id: string;
  type: 'id_document' | 'proof_of_address' | 'bank_statement' | 'other';
  name: string;
  url: string;
  status: 'pending' | 'approved' | 'rejected';
  uploadedAt: string;
}

export interface Account {
  id: string;
  accountNumber: string;
  accountType: 'current' | 'savings' | 'multi_currency';
  currency: string;
  balance: number;
  availableBalance: number;
  isActive: boolean;
  createdAt: string;
}

export interface Transaction {
  id: string;
  accountId?: string;
  account_id?: string;
  client_id?: string;
  msb_id?: string;
  transaction_number: string;
  type: 'credit' | 'debit';
  category: 'transfer' | 'payment' | 'deposit' | 'withdrawal' | 'fee';
  amount: number | string;
  currency: string;
  description: string;
  reference?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'failed' | 'payout_pending' | 'payin_completed' | 'cancelled';
  requiresApproval?: boolean;
  requires_approval?: boolean;
  approvedBy?: string;
  approved_by?: string;
  createdAt?: string;
  created_at: string;
  completedAt?: string;
  completed_at?: string;
  fromAccount?: string;
  from_account_id?: string;
  toAccount?: string;
  to_account_id?: string;
  beneficiary?: Beneficiary;
  beneficiary_id?: string;
  payment_method?: string;
  location?: string;
  merchant?: string;
  balance_after?: number | string;
  risk_score?: number;
  flags?: string[];
  metadata?: any;
  approved_at?: string;
  updated_at?: string;
  main_account?: Account;
  clients?: any; // For backward compatibility
  client_info?: {
    id: string;
    name: string;
    type: 'individual' | 'business';
  };
}

export interface Beneficiary {
  name: string;
  accountNumber: string;
  bankCode: string;
  bankName: string;
  country: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

export interface ComplianceReport {
  id: string;
  type: 'suspicious_activity' | 'large_transaction' | 'kyc_review';
  accountHolderId: string;
  description: string;
  status: 'open' | 'under_review' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  assignedTo?: string;
}