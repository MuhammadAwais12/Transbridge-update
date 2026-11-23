-- Fix transaction status constraint to allow BlindPay-specific statuses
-- Run this SQL in your database to fix the constraint error

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

-- Verify the constraint was applied
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'transactions'::regclass 
AND conname = 'transactions_status_check'; 