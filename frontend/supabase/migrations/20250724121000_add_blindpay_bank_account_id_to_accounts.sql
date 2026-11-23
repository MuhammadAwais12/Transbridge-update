-- Migration: Add blindpay_bank_account_id to accounts table
ALTER TABLE accounts
ADD COLUMN blindpay_bank_account_id text NULL; 