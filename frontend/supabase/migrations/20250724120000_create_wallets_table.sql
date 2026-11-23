-- Create wallets table
CREATE TABLE wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  network text NOT NULL,
  signature_tx_hash text,
  address text,
  is_account_abstraction boolean,
  blindpay_wallet_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for faster lookup by client
CREATE INDEX idx_wallets_client_id ON wallets(client_id); 