-- Update transaction status constraint to include BlindPay-specific statuses
-- This migration adds new status values needed for BlindPay integration

-- First, drop the existing constraint
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_status_check;

-- Add the new constraint with all required status values
ALTER TABLE transactions ADD CONSTRAINT transactions_status_check 
CHECK (status IN (
  'pending', 
  'approved', 
  'rejected', 
  'completed', 
  'failed', 
  'cancelled',
  -- BlindPay-specific statuses
  'payin_pending',
  'payin_completed',
  'payin_failed',
  'payout_pending',
  'payout_failed',
  'refunded'
)); 