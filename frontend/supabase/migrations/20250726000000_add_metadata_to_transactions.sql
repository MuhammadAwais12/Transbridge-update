-- Add metadata column to transactions table for storing BlindPay IDs and webhook data
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Add index for better query performance on metadata
CREATE INDEX IF NOT EXISTS idx_transactions_metadata ON transactions USING GIN (metadata); 