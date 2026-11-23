/*
  # Demo System Setup

  1. Demo Credentials Table
    - Simple table for demo login credentials
    - No complex relationships for demo purposes
    
  2. Sample Data
    - MSB companies with admin users
    - Client users with basic data
    - All using password: demo123
*/

-- Create demo credentials table for easy login testing
CREATE TABLE IF NOT EXISTS demo_credentials (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('msb_admin', 'client')),
  company_name TEXT,
  company_domain TEXT,
  password_hint TEXT DEFAULT 'demo123',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clear existing data
TRUNCATE TABLE audit_logs CASCADE;
TRUNCATE TABLE account_statements CASCADE;
TRUNCATE TABLE documents CASCADE;
TRUNCATE TABLE compliance_reports CASCADE;
TRUNCATE TABLE compliance_alerts CASCADE;
TRUNCATE TABLE transaction_limits CASCADE;
TRUNCATE TABLE transactions CASCADE;
TRUNCATE TABLE beneficiaries CASCADE;
TRUNCATE TABLE accounts CASCADE;
TRUNCATE TABLE clients CASCADE;
TRUNCATE TABLE users CASCADE;
TRUNCATE TABLE msbs CASCADE;

-- Insert MSB Companies
INSERT INTO msbs (id, name, domain, primary_color, secondary_color, accent_color, theme, settings) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'FinTech Solutions Ltd', 'banking.fintechsolutions.com', '#3b82f6', '#22c55e', '#f97316', 'light', '{}'),
('b1ffcd00-ad1c-5ef9-cc7e-7cc0ce491b22', 'Global Money Exchange', 'portal.globalmoney.com', '#8b5cf6', '#06b6d4', '#f59e0b', 'light', '{}'),
('c2eede11-be2d-6ef0-dd8f-8dd1df502c33', 'SecureBank Pro', 'app.securebank.pro', '#059669', '#3b82f6', '#dc2626', 'light', '{}');

-- Insert MSB Admin Users
INSERT INTO users (id, msb_id, email, name, role) VALUES
('11111111-1111-1111-1111-111111111111', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'admin@fintechsolutions.com', 'John Smith', 'msb_admin'),
('22222222-2222-2222-2222-222222222222', 'b1ffcd00-ad1c-5ef9-cc7e-7cc0ce491b22', 'admin@globalmoney.com', 'Maria Garcia', 'msb_admin'),
('33333333-3333-3333-3333-333333333333', 'c2eede11-be2d-6ef0-dd8f-8dd1df502c33', 'admin@securebank.pro', 'David Chen', 'msb_admin');

-- Insert Client Users
INSERT INTO users (id, msb_id, email, name, role) VALUES
-- FinTech Solutions clients
('44444444-4444-4444-4444-444444444444', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'sarah.johnson@email.com', 'Sarah Johnson', 'account_holder'),
('55555555-5555-5555-5555-555555555555', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'michael.chen@business.com', 'Michael Chen', 'account_holder'),
('66666666-6666-6666-6666-666666666666', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'emma.rodriguez@gmail.com', 'Emma Rodriguez', 'account_holder'),
-- Global Money Exchange clients
('77777777-7777-7777-7777-777777777777', 'b1ffcd00-ad1c-5ef9-cc7e-7cc0ce491b22', 'alex.thompson@corp.com', 'Alex Thompson', 'account_holder'),
('88888888-8888-8888-8888-888888888888', 'b1ffcd00-ad1c-5ef9-cc7e-7cc0ce491b22', 'lisa.wang@startup.io', 'Lisa Wang', 'account_holder'),
-- SecureBank Pro clients
('99999999-9999-9999-9999-999999999999', 'c2eede11-be2d-6ef0-dd8f-8dd1df502c33', 'robert.davis@finance.com', 'Robert Davis', 'account_holder'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'c2eede11-be2d-6ef0-dd8f-8dd1df502c33', 'jennifer.lee@tech.com', 'Jennifer Lee', 'account_holder');

-- Insert Client Profiles
INSERT INTO clients (id, user_id, msb_id, first_name, last_name, kyc_status, risk_level) VALUES
-- FinTech Solutions clients
('aaaabbbb-1111-2222-3333-444444444444', '44444444-4444-4444-4444-444444444444', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Sarah', 'Johnson', 'approved', 'low'),
('bbbbcccc-2222-3333-4444-555555555555', '55555555-5555-5555-5555-555555555555', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Michael', 'Chen', 'approved', 'medium'),
('ccccdddd-3333-4444-5555-666666666666', '66666666-6666-6666-6666-666666666666', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Emma', 'Rodriguez', 'pending', 'low'),
-- Global Money Exchange clients
('ddddeeee-4444-5555-6666-777777777777', '77777777-7777-7777-7777-777777777777', 'b1ffcd00-ad1c-5ef9-cc7e-7cc0ce491b22', 'Alex', 'Thompson', 'approved', 'high'),
('eeeeffff-5555-6666-7777-888888888888', '88888888-8888-8888-8888-888888888888', 'b1ffcd00-ad1c-5ef9-cc7e-7cc0ce491b22', 'Lisa', 'Wang', 'approved', 'medium'),
-- SecureBank Pro clients
('ffffeeee-6666-7777-8888-999999999999', '99999999-9999-9999-9999-999999999999', 'c2eede11-be2d-6ef0-dd8f-8dd1df502c33', 'Robert', 'Davis', 'approved', 'low'),
('eeeedddd-7777-8888-9999-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'c2eede11-be2d-6ef0-dd8f-8dd1df502c33', 'Jennifer', 'Lee', 'approved', 'low');

-- Insert Sample Accounts
INSERT INTO accounts (id, client_id, msb_id, account_number, account_name, account_type, currency, balance, available_balance, status) VALUES
-- FinTech Solutions accounts
('1111aaaa-1111-1111-1111-111111111111', 'aaaabbbb-1111-2222-3333-444444444444', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '1001234567', 'Primary Checking', 'current', 'USD', 25750.00, 25750.00, 'active'),
('2222bbbb-2222-2222-2222-222222222222', 'bbbbcccc-2222-3333-4444-555555555555', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '1002345678', 'Business Account', 'business', 'USD', 85300.50, 85300.50, 'active'),
('3333cccc-3333-3333-3333-333333333333', 'ccccdddd-3333-4444-5555-666666666666', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '1003456789', 'Current Account', 'current', 'USD', 500.00, 500.00, 'active'),
-- Global Money Exchange accounts
('4444dddd-4444-4444-4444-444444444444', 'ddddeeee-4444-5555-6666-777777777777', 'b1ffcd00-ad1c-5ef9-cc7e-7cc0ce491b22', '2001234567', 'Investment Account', 'current', 'GBP', 78900.25, 78900.25, 'active'),
('5555eeee-5555-5555-5555-555555555555', 'eeeeffff-5555-6666-7777-888888888888', 'b1ffcd00-ad1c-5ef9-cc7e-7cc0ce491b22', '2002345678', 'Startup Account', 'business', 'USD', 125000.00, 120000.00, 'active'),
-- SecureBank Pro accounts
('6666ffff-6666-6666-6666-666666666666', 'ffffeeee-6666-7777-8888-999999999999', 'c2eede11-be2d-6ef0-dd8f-8dd1df502c33', '3001234567', 'Premium Checking', 'current', 'USD', 45000.00, 45000.00, 'active'),
('7777aaaa-7777-7777-7777-777777777777', 'eeeedddd-7777-8888-9999-aaaaaaaaaaaa', 'c2eede11-be2d-6ef0-dd8f-8dd1df502c33', '3002345678', 'Tech Professional', 'current', 'USD', 32000.00, 32000.00, 'active');

-- Insert Sample Transactions
INSERT INTO transactions (id, msb_id, account_id, client_id, transaction_number, type, category, amount, currency, description, status, created_at) VALUES
-- FinTech Solutions transactions
('a1111111-1111-1111-1111-111111111111', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '1111aaaa-1111-1111-1111-111111111111', 'aaaabbbb-1111-2222-3333-444444444444', 'TXN-FT-001', 'credit', 'deposit', 2500.00, 'USD', 'Salary Deposit', 'completed', '2024-01-15T10:30:00Z'),
('a2222222-2222-2222-2222-222222222222', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '2222bbbb-2222-2222-2222-222222222222', 'bbbbcccc-2222-3333-4444-555555555555', 'TXN-FT-002', 'credit', 'deposit', 15000.00, 'USD', 'Business Revenue', 'completed', '2024-01-14T16:45:00Z'),
-- Global Money Exchange transactions
('b3333333-3333-3333-3333-333333333333', 'b1ffcd00-ad1c-5ef9-cc7e-7cc0ce491b22', '4444dddd-4444-4444-4444-444444444444', 'ddddeeee-4444-5555-6666-777777777777', 'TXN-GM-001', 'debit', 'transfer', -25000.00, 'GBP', 'International Transfer', 'pending', '2024-01-15T10:30:00Z'),
('b4444444-4444-4444-4444-444444444444', 'b1ffcd00-ad1c-5ef9-cc7e-7cc0ce491b22', '5555eeee-5555-5555-5555-555555555555', 'eeeeffff-5555-6666-7777-888888888888', 'TXN-GM-002', 'debit', 'payment', -5000.00, 'USD', 'Equipment Purchase', 'completed', '2024-01-13T14:22:00Z'),
-- SecureBank Pro transactions
('c5555555-5555-5555-5555-555555555555', 'c2eede11-be2d-6ef0-dd8f-8dd1df502c33', '6666ffff-6666-6666-6666-666666666666', 'ffffeeee-6666-7777-8888-999999999999', 'TXN-SB-001', 'credit', 'deposit', 8000.00, 'USD', 'Investment Return', 'completed', '2024-01-15T11:45:00Z'),
('c6666666-6666-6666-6666-666666666666', 'c2eede11-be2d-6ef0-dd8f-8dd1df502c33', '7777aaaa-7777-7777-7777-777777777777', 'eeeedddd-7777-8888-9999-aaaaaaaaaaaa', 'TXN-SB-002', 'credit', 'deposit', 4500.00, 'USD', 'Freelance Payment', 'completed', '2024-01-12T16:20:00Z');

-- Insert Sample Compliance Alerts
INSERT INTO compliance_alerts (id, msb_id, client_id, alert_type, severity, status, description) VALUES
('e1111111-1111-1111-1111-111111111111', 'b1ffcd00-ad1c-5ef9-cc7e-7cc0ce491b22', 'ddddeeee-4444-5555-6666-777777777777', 'suspicious_activity', 'high', 'open', 'Large international transfer requires review'),
('e2222222-2222-2222-2222-222222222222', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'bbbbcccc-2222-3333-4444-555555555555', 'large_transaction', 'medium', 'under_review', 'Business deposit exceeds normal pattern'),
('e3333333-3333-3333-3333-333333333333', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'ccccdddd-3333-4444-5555-666666666666', 'kyc_review', 'low', 'open', 'KYC documentation requires completion');

-- Populate demo credentials table
INSERT INTO demo_credentials (email, name, user_type, company_name, company_domain) VALUES
-- MSB Admins
('admin@fintechsolutions.com', 'John Smith', 'msb_admin', 'FinTech Solutions Ltd', 'banking.fintechsolutions.com'),
('admin@globalmoney.com', 'Maria Garcia', 'msb_admin', 'Global Money Exchange', 'portal.globalmoney.com'),
('admin@securebank.pro', 'David Chen', 'msb_admin', 'SecureBank Pro', 'app.securebank.pro'),
-- FinTech Solutions Clients
('sarah.johnson@email.com', 'Sarah Johnson', 'client', 'FinTech Solutions Ltd', 'banking.fintechsolutions.com'),
('michael.chen@business.com', 'Michael Chen', 'client', 'FinTech Solutions Ltd', 'banking.fintechsolutions.com'),
('emma.rodriguez@gmail.com', 'Emma Rodriguez', 'client', 'FinTech Solutions Ltd', 'banking.fintechsolutions.com'),
-- Global Money Exchange Clients
('alex.thompson@corp.com', 'Alex Thompson', 'client', 'Global Money Exchange', 'portal.globalmoney.com'),
('lisa.wang@startup.io', 'Lisa Wang', 'client', 'Global Money Exchange', 'portal.globalmoney.com'),
-- SecureBank Pro Clients
('robert.davis@finance.com', 'Robert Davis', 'client', 'SecureBank Pro', 'app.securebank.pro'),
('jennifer.lee@tech.com', 'Jennifer Lee', 'client', 'SecureBank Pro', 'app.securebank.pro');