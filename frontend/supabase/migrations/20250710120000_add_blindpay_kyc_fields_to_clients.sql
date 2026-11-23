-- Migration: Add BlindPay receiver id and KYC fields to clients table
-- Date: 2025-07-10

ALTER TABLE clients
  ADD COLUMN blindpay_receiver_id text,
  ADD COLUMN client_type text CHECK (client_type IN ('individual', 'business')) DEFAULT 'individual',
  ADD COLUMN legal_name text,
  ADD COLUMN doing_business_as text,
  ADD COLUMN formation_date date,
  ADD COLUMN website text,
  ADD COLUMN ubos jsonb,
  ADD COLUMN shareholders jsonb,
  ADD COLUMN ip_address text,
  ADD COLUMN address_1 text,
  ADD COLUMN address_2 text,
  ADD COLUMN city text,
  ADD COLUMN state text,
  ADD COLUMN postal_code text,
  ADD COLUMN id_document_country text,
  ADD COLUMN id_document_type text,
  ADD COLUMN id_document_front text,
  ADD COLUMN id_document_back text,
  ADD COLUMN proof_of_address_type text,
  ADD COLUMN proof_of_address_document text,
  ADD COLUMN company_formation_document text,
  ADD COLUMN proof_of_ownership_document text,
  ADD COLUMN kyc_type text,
  ADD COLUMN kyc_warnings jsonb; 