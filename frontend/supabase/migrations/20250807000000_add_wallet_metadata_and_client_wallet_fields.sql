-- Migration: Add metadata to wallets and wallet fields to clients
-- Date: 2025-08-07

-- Add metadata column to wallets table for BlindPay and extra info
ALTER TABLE wallets
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Add wallet fields to clients table for wallet linking
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS wallet_address VARCHAR(42),
ADD COLUMN IF NOT EXISTS wallet_network VARCHAR(50),
ADD COLUMN IF NOT EXISTS wallet_connected_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS blindpay_wallet_id VARCHAR(100);

-- Comments for documentation
COMMENT ON COLUMN wallets.metadata IS 'BlindPay wallet API response and extra wallet metadata';
COMMENT ON COLUMN clients.wallet_address IS 'Linked crypto wallet address (e.g., MetaMask)';
COMMENT ON COLUMN clients.wallet_network IS 'Network of linked wallet (e.g., polygon, base)';
COMMENT ON COLUMN clients.wallet_connected_at IS 'Timestamp when wallet was linked';
COMMENT ON COLUMN clients.blindpay_wallet_id IS 'BlindPay wallet ID for the client';