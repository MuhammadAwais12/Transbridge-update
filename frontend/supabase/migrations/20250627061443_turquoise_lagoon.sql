/*
  # Comprehensive MSB Banking Platform Schema

  1. New Tables
    - `msbs` - Money Service Business entities
    - `users` - All platform users (MSB admins and clients)
    - `clients` - Client-specific information and KYC data
    - `accounts` - Bank accounts for clients
    - `transactions` - All financial transactions
    - `beneficiaries` - Transfer recipients
    - `compliance_alerts` - Compliance monitoring alerts
    - `compliance_reports` - Regulatory reports
    - `audit_logs` - System audit trail
    - `documents` - KYC and other document storage
    - `account_statements` - Generated statements
    - `transaction_limits` - Account and client limits

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for MSB admins and clients
    - Secure data access based on MSB ownership

  3. Features
    - Complete KYC workflow support
    - Multi-currency account support
    - Comprehensive transaction tracking
    - Compliance monitoring and reporting
    - Document management
    - Audit trail
*/

-- MSB (Money Service Business) table
CREATE TABLE IF NOT EXISTS msbs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  domain text UNIQUE NOT NULL,
  logo_url text,
  primary_color text DEFAULT '#3b82f6',
  secondary_color text DEFAULT '#22c55e',
  accent_color text DEFAULT '#f97316',
  theme text DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  is_active boolean DEFAULT true,
  settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Users table (MSB admins and clients)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  msb_id uuid REFERENCES msbs(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('msb_admin', 'account_holder')),
  is_active boolean DEFAULT true,
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Clients table (detailed client information)
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  msb_id uuid REFERENCES msbs(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  date_of_birth date,
  nationality text,
  phone_number text,
  id_type text CHECK (id_type IN ('passport', 'driver_license', 'national_id')),
  id_number text,
  occupation text,
  source_of_funds text,
  annual_income_range text,
  address jsonb DEFAULT '{}',
  kyc_status text DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'approved', 'rejected', 'requires_documents')),
  risk_level text DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
  kyc_completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Accounts table
CREATE TABLE IF NOT EXISTS accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  msb_id uuid REFERENCES msbs(id) ON DELETE CASCADE,
  account_number text UNIQUE NOT NULL,
  account_name text NOT NULL,
  account_type text NOT NULL CHECK (account_type IN ('current', 'savings', 'multi_currency', 'business')),
  currency text NOT NULL DEFAULT 'USD',
  balance decimal(15,2) DEFAULT 0,
  available_balance decimal(15,2) DEFAULT 0,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'frozen', 'closed')),
  interest_rate decimal(5,2),
  overdraft_limit decimal(15,2),
  minimum_balance decimal(15,2),
  monthly_fee decimal(10,2) DEFAULT 0,
  opened_date timestamptz DEFAULT now(),
  last_activity timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Beneficiaries table
CREATE TABLE IF NOT EXISTS beneficiaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  msb_id uuid REFERENCES msbs(id) ON DELETE CASCADE,
  name text NOT NULL,
  account_number text NOT NULL,
  bank_name text NOT NULL,
  bank_code text,
  country text NOT NULL,
  type text NOT NULL CHECK (type IN ('internal', 'domestic', 'international')),
  email text,
  phone text,
  address text,
  is_verified boolean DEFAULT false,
  last_used timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  msb_id uuid REFERENCES msbs(id) ON DELETE CASCADE,
  account_id uuid REFERENCES accounts(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  transaction_number text UNIQUE NOT NULL,
  type text NOT NULL CHECK (type IN ('credit', 'debit')),
  category text NOT NULL CHECK (category IN ('transfer', 'payment', 'deposit', 'withdrawal', 'fee', 'interest', 'refund')),
  amount decimal(15,2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  description text NOT NULL,
  reference text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'failed', 'cancelled')),
  requires_approval boolean DEFAULT false,
  from_account_id uuid REFERENCES accounts(id),
  to_account_id uuid REFERENCES accounts(id),
  beneficiary_id uuid REFERENCES beneficiaries(id),
  payment_method text CHECK (payment_method IN ('card', 'online', 'mobile', 'atm', 'wire', 'ach')),
  location text,
  merchant text,
  balance_after decimal(15,2),
  risk_score integer DEFAULT 0,
  flags text[] DEFAULT '{}',
  approved_by uuid REFERENCES users(id),
  approved_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Transaction limits table
CREATE TABLE IF NOT EXISTS transaction_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  msb_id uuid REFERENCES msbs(id) ON DELETE CASCADE,
  daily_limit decimal(15,2) DEFAULT 10000,
  monthly_limit decimal(15,2) DEFAULT 50000,
  per_transaction_limit decimal(15,2) DEFAULT 5000,
  daily_used decimal(15,2) DEFAULT 0,
  monthly_used decimal(15,2) DEFAULT 0,
  last_reset_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Compliance alerts table
CREATE TABLE IF NOT EXISTS compliance_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  msb_id uuid REFERENCES msbs(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  transaction_id uuid REFERENCES transactions(id),
  alert_type text NOT NULL CHECK (alert_type IN ('suspicious_activity', 'large_transaction', 'kyc_review', 'aml_flag', 'sanctions_check')),
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status text DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved', 'false_positive')),
  description text NOT NULL,
  amount decimal(15,2),
  assigned_to uuid REFERENCES users(id),
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Compliance reports table
CREATE TABLE IF NOT EXISTS compliance_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  msb_id uuid REFERENCES msbs(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('sar', 'ctr', 'kyc_summary', 'transaction_monitoring', 'risk_assessment')),
  period_start date NOT NULL,
  period_end date NOT NULL,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'submitted', 'approved')),
  content jsonb DEFAULT '{}',
  file_url text,
  due_date timestamptz,
  submitted_at timestamptz,
  submitted_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  msb_id uuid REFERENCES msbs(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('id_document', 'proof_of_address', 'bank_statement', 'other')),
  file_url text NOT NULL,
  file_size bigint,
  mime_type text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES users(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Account statements table
CREATE TABLE IF NOT EXISTS account_statements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES accounts(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  msb_id uuid REFERENCES msbs(id) ON DELETE CASCADE,
  statement_number text UNIQUE NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  type text NOT NULL CHECK (type IN ('monthly', 'quarterly', 'annual', 'custom')),
  status text DEFAULT 'available' CHECK (status IN ('generating', 'available', 'archived')),
  file_url text,
  file_size text,
  transaction_count integer DEFAULT 0,
  opening_balance decimal(15,2) DEFAULT 0,
  closing_balance decimal(15,2) DEFAULT 0,
  total_credits decimal(15,2) DEFAULT 0,
  total_debits decimal(15,2) DEFAULT 0,
  download_count integer DEFAULT 0,
  generated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  msb_id uuid REFERENCES msbs(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id),
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  details jsonb DEFAULT '{}',
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE msbs ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE beneficiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for MSB Admins (can access all data for their MSB)
CREATE POLICY "MSB admins can manage their MSB data" ON msbs
  FOR ALL TO authenticated
  USING (id IN (
    SELECT msb_id FROM users WHERE id = auth.uid() AND role = 'msb_admin'
  ));

CREATE POLICY "MSB admins can manage users in their MSB" ON users
  FOR ALL TO authenticated
  USING (msb_id IN (
    SELECT msb_id FROM users WHERE id = auth.uid() AND role = 'msb_admin'
  ));

CREATE POLICY "MSB admins can manage clients in their MSB" ON clients
  FOR ALL TO authenticated
  USING (msb_id IN (
    SELECT msb_id FROM users WHERE id = auth.uid() AND role = 'msb_admin'
  ));

CREATE POLICY "MSB admins can manage accounts in their MSB" ON accounts
  FOR ALL TO authenticated
  USING (msb_id IN (
    SELECT msb_id FROM users WHERE id = auth.uid() AND role = 'msb_admin'
  ));

CREATE POLICY "MSB admins can manage beneficiaries in their MSB" ON beneficiaries
  FOR ALL TO authenticated
  USING (msb_id IN (
    SELECT msb_id FROM users WHERE id = auth.uid() AND role = 'msb_admin'
  ));

CREATE POLICY "MSB admins can manage transactions in their MSB" ON transactions
  FOR ALL TO authenticated
  USING (msb_id IN (
    SELECT msb_id FROM users WHERE id = auth.uid() AND role = 'msb_admin'
  ));

CREATE POLICY "MSB admins can manage transaction limits in their MSB" ON transaction_limits
  FOR ALL TO authenticated
  USING (msb_id IN (
    SELECT msb_id FROM users WHERE id = auth.uid() AND role = 'msb_admin'
  ));

CREATE POLICY "MSB admins can manage compliance alerts in their MSB" ON compliance_alerts
  FOR ALL TO authenticated
  USING (msb_id IN (
    SELECT msb_id FROM users WHERE id = auth.uid() AND role = 'msb_admin'
  ));

CREATE POLICY "MSB admins can manage compliance reports in their MSB" ON compliance_reports
  FOR ALL TO authenticated
  USING (msb_id IN (
    SELECT msb_id FROM users WHERE id = auth.uid() AND role = 'msb_admin'
  ));

CREATE POLICY "MSB admins can manage documents in their MSB" ON documents
  FOR ALL TO authenticated
  USING (msb_id IN (
    SELECT msb_id FROM users WHERE id = auth.uid() AND role = 'msb_admin'
  ));

CREATE POLICY "MSB admins can manage statements in their MSB" ON account_statements
  FOR ALL TO authenticated
  USING (msb_id IN (
    SELECT msb_id FROM users WHERE id = auth.uid() AND role = 'msb_admin'
  ));

CREATE POLICY "MSB admins can view audit logs in their MSB" ON audit_logs
  FOR SELECT TO authenticated
  USING (msb_id IN (
    SELECT msb_id FROM users WHERE id = auth.uid() AND role = 'msb_admin'
  ));

-- RLS Policies for Clients (can only access their own data)
CREATE POLICY "Clients can view their own user data" ON users
  FOR SELECT TO authenticated
  USING (id = auth.uid() AND role = 'account_holder');

CREATE POLICY "Clients can view their own client data" ON clients
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Clients can view their own accounts" ON accounts
  FOR SELECT TO authenticated
  USING (client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  ));

CREATE POLICY "Clients can manage their own beneficiaries" ON beneficiaries
  FOR ALL TO authenticated
  USING (client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  ));

CREATE POLICY "Clients can view their own transactions" ON transactions
  FOR SELECT TO authenticated
  USING (client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  ));

CREATE POLICY "Clients can create transactions from their accounts" ON transactions
  FOR INSERT TO authenticated
  WITH CHECK (client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  ));

CREATE POLICY "Clients can view their own transaction limits" ON transaction_limits
  FOR SELECT TO authenticated
  USING (client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  ));

CREATE POLICY "Clients can view their own documents" ON documents
  FOR ALL TO authenticated
  USING (client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  ));

CREATE POLICY "Clients can view their own statements" ON account_statements
  FOR SELECT TO authenticated
  USING (client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  ));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_msb_id ON users(msb_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_msb_id ON clients(msb_id);
CREATE INDEX IF NOT EXISTS idx_accounts_client_id ON accounts(client_id);
CREATE INDEX IF NOT EXISTS idx_accounts_msb_id ON accounts(msb_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_client_id ON transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_transactions_msb_id ON transactions(msb_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_compliance_alerts_msb_id ON compliance_alerts(msb_id);
CREATE INDEX IF NOT EXISTS idx_compliance_alerts_status ON compliance_alerts(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_msb_id ON audit_logs(msb_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Functions for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_msbs_updated_at BEFORE UPDATE ON msbs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_beneficiaries_updated_at BEFORE UPDATE ON beneficiaries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transaction_limits_updated_at BEFORE UPDATE ON transaction_limits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_compliance_alerts_updated_at BEFORE UPDATE ON compliance_alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_compliance_reports_updated_at BEFORE UPDATE ON compliance_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();