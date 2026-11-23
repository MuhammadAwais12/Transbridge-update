-- Migration: Add blindpay_bank_account_id to beneficiaries table
ALTER TABLE beneficiaries
ADD COLUMN blindpay_bank_account_id text NULL; 