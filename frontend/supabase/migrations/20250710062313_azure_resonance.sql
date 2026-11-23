/*
  # Payment Provider Integration Schema

  1. New Tables
    - `payment_providers` - Configuration for payment service providers
    - `provider_accounts` - Mapping between internal accounts and provider accounts
    - `payment_transactions` - Records of payments processed through providers
    - `provider_webhooks` - Log of received webhook events

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for MSB admins

  3. Features
    - Support for multiple payment providers
    - Tracking of provider-specific account IDs
    - Complete payment transaction history
    - Webhook event logging
*/

-- Payment providers configuration
CREATE TABLE IF NOT EXISTS payment_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  msb_id uuid REFERENCES msbs(id) ON DELETE CASCADE,
  provider_name text NOT NULL,
  provider_type text NOT NULL,
  is_active boolean DEFAULT true,
  config jsonb NOT NULL DEFAULT '{}',
  credentials jsonb NOT NULL DEFAULT '{}',
  webhook_secret text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(msb_id, provider_name)
);

-- Provider accounts mapping
CREATE TABLE IF NOT EXISTS provider_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  msb_id uuid REFERENCES msbs(id) ON DELETE CASCADE,
  account_id uuid REFERENCES accounts(id) ON DELETE CASCADE,
  provider_id uuid REFERENCES payment_providers(id) ON DELETE CASCADE,
  provider_account_id text NOT NULL,
  provider_account_details jsonb DEFAULT '{}',
  status text DEFAULT 'active',
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(account_id, provider_id)
);

-- Payment transactions through providers
CREATE TABLE IF NOT EXISTS payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  msb_id uuid REFERENCES msbs(id) ON DELETE CASCADE,
  transaction_id uuid REFERENCES transactions(id) ON DELETE CASCADE,
  provider_id uuid REFERENCES payment_providers(id) ON DELETE CASCADE,
  provider_transaction_id text NOT NULL,
  amount decimal(15,2) NOT NULL,
  currency text NOT NULL,
  fee decimal(15,2) DEFAULT 0,
  exchange_rate decimal(20,10),
  status text NOT NULL,
  status_details text,
  provider_response jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Provider webhook events
CREATE TABLE IF NOT EXISTS provider_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  msb_id uuid REFERENCES msbs(id) ON DELETE CASCADE,
  provider_id uuid REFERENCES payment_providers(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_id text,
  payload jsonb NOT NULL,
  processed boolean DEFAULT false,
  processing_result jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE payment_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_webhooks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for MSB Admins
CREATE POLICY "MSB admins can manage payment providers in their MSB" ON payment_providers
  FOR ALL TO authenticated
  USING (msb_id IN (
    SELECT msb_id FROM users WHERE id = auth.uid() AND role = 'msb_admin'
  ));

CREATE POLICY "MSB admins can manage provider accounts in their MSB" ON provider_accounts
  FOR ALL TO authenticated
  USING (msb_id IN (
    SELECT msb_id FROM users WHERE id = auth.uid() AND role = 'msb_admin'
  ));

CREATE POLICY "MSB admins can manage payment transactions in their MSB" ON payment_transactions
  FOR ALL TO authenticated
  USING (msb_id IN (
    SELECT msb_id FROM users WHERE id = auth.uid() AND role = 'msb_admin'
  ));

CREATE POLICY "MSB admins can view webhook events in their MSB" ON provider_webhooks
  FOR ALL TO authenticated
  USING (msb_id IN (
    SELECT msb_id FROM users WHERE id = auth.uid() AND role = 'msb_admin'
  ));

-- Clients can view their own provider accounts
CREATE POLICY "Clients can view their own provider accounts" ON provider_accounts
  FOR SELECT TO authenticated
  USING (account_id IN (
    SELECT id FROM accounts WHERE client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
  ));

-- Clients can view their own payment transactions
CREATE POLICY "Clients can view their own payment transactions" ON payment_transactions
  FOR SELECT TO authenticated
  USING (transaction_id IN (
    SELECT id FROM transactions WHERE client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
  ));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_provider_accounts_account_id ON provider_accounts(account_id);
CREATE INDEX IF NOT EXISTS idx_provider_accounts_provider_id ON provider_accounts(provider_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_transaction_id ON payment_transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_provider_id ON payment_transactions(provider_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_provider_webhooks_provider_id ON provider_webhooks(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_webhooks_event_type ON provider_webhooks(event_type);
CREATE INDEX IF NOT EXISTS idx_provider_webhooks_processed ON provider_webhooks(processed);

-- Add trigger for updated_at columns
CREATE TRIGGER update_payment_providers_updated_at
BEFORE UPDATE ON payment_providers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_provider_accounts_updated_at
BEFORE UPDATE ON provider_accounts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_transactions_updated_at
BEFORE UPDATE ON payment_transactions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();