/*
  # Comprehensive Authentication and Sample Data Setup

  1. Authentication Setup
    - Create auth users for MSB admins and clients
    - Link auth users to our custom users table

  2. Sample MSB Companies
    - Multiple MSB companies with different branding
    - Admin users for each MSB

  3. Sample Clients
    - Multiple clients per MSB
    - Complete KYC profiles
    - Multiple accounts per client
    - Transaction history

  4. Comprehensive Test Data
    - Beneficiaries, compliance alerts, reports
    - Documents and statements
    - Audit logs
*/

-- First, clear existing data to start fresh
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
INSERT INTO msbs (id, name, domain, logo_url, primary_color, secondary_color, accent_color, theme, settings) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'FinTech Solutions Ltd', 'banking.fintechsolutions.com', null, '#3b82f6', '#22c55e', '#f97316', 'light', 
 '{"requireTransactionApproval": true, "approvalThreshold": 10000, "allowInternationalTransfers": true, "mfaRequired": true, "sessionTimeout": 30}'),
('b1ffcd00-ad1c-5ef9-cc7e-7cc0ce491b22', 'Global Money Exchange', 'portal.globalmoney.com', null, '#8b5cf6', '#06b6d4', '#f59e0b', 'light',
 '{"requireTransactionApproval": true, "approvalThreshold": 5000, "allowInternationalTransfers": true, "mfaRequired": true, "sessionTimeout": 45}'),
('c2ggde11-be2d-6gh0-dd8f-8dd1df502c33', 'SecureBank Pro', 'app.securebank.pro', null, '#059669', '#3b82f6', '#dc2626', 'light',
 '{"requireTransactionApproval": false, "approvalThreshold": 25000, "allowInternationalTransfers": true, "mfaRequired": false, "sessionTimeout": 60}');

-- Insert MSB Admin Users
INSERT INTO users (id, msb_id, email, name, role, last_login) VALUES
-- FinTech Solutions Admin
('11111111-1111-1111-1111-111111111111', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'admin@fintechsolutions.com', 'John Smith', 'msb_admin', '2024-01-15T10:30:00Z'),
-- Global Money Exchange Admin
('22222222-2222-2222-2222-222222222222', 'b1ffcd00-ad1c-5ef9-cc7e-7cc0ce491b22', 'admin@globalmoney.com', 'Maria Garcia', 'msb_admin', '2024-01-15T08:45:00Z'),
-- SecureBank Pro Admin
('33333333-3333-3333-3333-333333333333', 'c2ggde11-be2d-6gh0-dd8f-8dd1df502c33', 'admin@securebank.pro', 'David Chen', 'msb_admin', '2024-01-15T14:20:00Z');

-- Insert Client Users for FinTech Solutions
INSERT INTO users (id, msb_id, email, name, role, last_login) VALUES
('44444444-4444-4444-4444-444444444444', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'sarah.johnson@email.com', 'Sarah Johnson', 'account_holder', '2024-01-15T10:30:00Z'),
('55555555-5555-5555-5555-555555555555', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'michael.chen@business.com', 'Michael Chen', 'account_holder', '2024-01-14T16:45:00Z'),
('66666666-6666-6666-6666-666666666666', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'emma.rodriguez@gmail.com', 'Emma Rodriguez', 'account_holder', null);

-- Insert Client Users for Global Money Exchange
INSERT INTO users (id, msb_id, email, name, role, last_login) VALUES
('77777777-7777-7777-7777-777777777777', 'b1ffcd00-ad1c-5ef9-cc7e-7cc0ce491b22', 'alex.thompson@corp.com', 'Alex Thompson', 'account_holder', '2024-01-14T12:15:00Z'),
('88888888-8888-8888-8888-888888888888', 'b1ffcd00-ad1c-5ef9-cc7e-7cc0ce491b22', 'lisa.wang@startup.io', 'Lisa Wang', 'account_holder', '2024-01-13T09:30:00Z');

-- Insert Client Users for SecureBank Pro
INSERT INTO users (id, msb_id, email, name, role, last_login) VALUES
('99999999-9999-9999-9999-999999999999', 'c2ggde11-be2d-6gh0-dd8f-8dd1df502c33', 'robert.davis@finance.com', 'Robert Davis', 'account_holder', '2024-01-15T11:45:00Z'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'c2ggde11-be2d-6gh0-dd8f-8dd1df502c33', 'jennifer.lee@tech.com', 'Jennifer Lee', 'account_holder', '2024-01-12T16:20:00Z');

-- Insert Client Profiles for FinTech Solutions
INSERT INTO clients (id, user_id, msb_id, first_name, last_name, date_of_birth, nationality, phone_number, id_type, id_number, occupation, source_of_funds, annual_income_range, address, kyc_status, risk_level, kyc_completed_at) VALUES
('aaaabbbb-1111-2222-3333-444444444444', '44444444-4444-4444-4444-444444444444', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Sarah', 'Johnson', '1985-03-15', 'United States', '+1-555-123-4567', 'driver_license', 'DL123456789', 'Software Engineer', 'employment', '50k-100k', '{"street": "123 Main St", "city": "New York", "state": "NY", "postalCode": "10001", "country": "United States"}', 'approved', 'low', '2024-01-02T00:00:00Z'),
('bbbbcccc-2222-3333-4444-555555555555', '55555555-5555-5555-5555-555555555555', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Michael', 'Chen', '1978-11-22', 'Canada', '+1-555-987-6543', 'passport', 'P987654321', 'Business Owner', 'business', '100k-250k', '{"street": "456 Business Ave", "city": "Toronto", "state": "ON", "postalCode": "M5V 3A8", "country": "Canada"}', 'approved', 'medium', '2023-12-16T00:00:00Z'),
('ccccdddd-3333-4444-5555-666666666666', '66666666-6666-6666-6666-666666666666', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Emma', 'Rodriguez', '1992-07-08', 'Mexico', '+1-555-456-7890', 'passport', 'P456789123', 'Marketing Manager', 'employment', '25k-50k', '{"street": "789 Oak St", "city": "Mexico City", "state": "CDMX", "postalCode": "01000", "country": "Mexico"}', 'requires_documents', 'low', null);

-- Insert Client Profiles for Global Money Exchange
INSERT INTO clients (id, user_id, msb_id, first_name, last_name, date_of_birth, nationality, phone_number, id_type, id_number, occupation, source_of_funds, annual_income_range, address, kyc_status, risk_level, kyc_completed_at) VALUES
('ddddeeee-4444-5555-6666-777777777777', '77777777-7777-7777-7777-777777777777', 'b1ffcd00-ad1c-5ef9-cc7e-7cc0ce491b22', 'Alex', 'Thompson', '1975-12-03', 'United Kingdom', '+44-20-7123-4567', 'passport', 'P321654987', 'Investment Banker', 'investments', '250k-500k', '{"street": "10 Downing St", "city": "London", "state": "England", "postalCode": "SW1A 2AA", "country": "United Kingdom"}', 'approved', 'high', '2023-11-21T00:00:00Z'),
('eeeeffff-5555-6666-7777-888888888888', '88888888-8888-8888-8888-888888888888', 'b1ffcd00-ad1c-5ef9-cc7e-7cc0ce491b22', 'Lisa', 'Wang', '1988-09-14', 'United States', '+1-555-789-0123', 'driver_license', 'DL987654321', 'Tech Entrepreneur', 'business', '100k-250k', '{"street": "321 Innovation Dr", "city": "San Francisco", "state": "CA", "postalCode": "94105", "country": "United States"}', 'approved', 'medium', '2024-01-01T00:00:00Z');

-- Insert Client Profiles for SecureBank Pro
INSERT INTO clients (id, user_id, msb_id, first_name, last_name, date_of_birth, nationality, phone_number, id_type, id_number, occupation, source_of_funds, annual_income_range, address, kyc_status, risk_level, kyc_completed_at) VALUES
('ffffgggg-6666-7777-8888-999999999999', '99999999-9999-9999-9999-999999999999', 'c2ggde11-be2d-6gh0-dd8f-8dd1df502c33', 'Robert', 'Davis', '1980-05-20', 'United States', '+1-555-234-5678', 'driver_license', 'DL234567890', 'Financial Analyst', 'employment', '75k-100k', '{"street": "567 Finance Blvd", "city": "Chicago", "state": "IL", "postalCode": "60601", "country": "United States"}', 'approved', 'low', '2024-01-05T00:00:00Z'),
('gggghhhh-7777-8888-9999-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'c2ggde11-be2d-6gh0-dd8f-8dd1df502c33', 'Jennifer', 'Lee', '1990-08-12', 'South Korea', '+1-555-345-6789', 'passport', 'P345678901', 'Software Developer', 'employment', '50k-75k', '{"street": "890 Tech Park", "city": "Seattle", "state": "WA", "postalCode": "98101", "country": "United States"}', 'approved', 'low', '2024-01-03T00:00:00Z');

-- Insert Accounts for FinTech Solutions clients
INSERT INTO accounts (id, client_id, msb_id, account_number, account_name, account_type, currency, balance, available_balance, status, interest_rate, overdraft_limit, minimum_balance, monthly_fee) VALUES
-- Sarah Johnson's accounts
('1111aaaa-1111-1111-1111-111111111111', 'aaaabbbb-1111-2222-3333-444444444444', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '1001234567', 'Primary Checking', 'current', 'USD', 25750.00, 25750.00, 'active', null, 5000, null, 0),
('2222bbbb-2222-2222-2222-222222222222', 'aaaabbbb-1111-2222-3333-444444444444', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '1001234568', 'High Yield Savings', 'savings', 'USD', 20000.00, 20000.00, 'active', 2.5, null, 1000, 0),
-- Michael Chen's accounts
('3333cccc-3333-3333-3333-333333333333', 'bbbbcccc-2222-3333-4444-555555555555', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '1002345678', 'Business Checking', 'business', 'USD', 85300.50, 85300.50, 'active', null, 15000, null, 25),
('4444dddd-4444-4444-4444-444444444444', 'bbbbcccc-2222-3333-4444-555555555555', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '1002345679', 'Multi-Currency Account', 'multi_currency', 'CAD', 40000.00, 35000.00, 'active', null, 10000, null, 15),
-- Emma Rodriguez's account
('5555eeee-5555-5555-5555-555555555555', 'ccccdddd-3333-4444-5555-666666666666', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '1003456789', 'Current Account', 'current', 'USD', 500.00, 500.00, 'active', null, null, null, 0);

-- Insert Accounts for Global Money Exchange clients
INSERT INTO accounts (id, client_id, msb_id, account_number, account_name, account_type, currency, balance, available_balance, status, interest_rate, overdraft_limit, minimum_balance, monthly_fee) VALUES
-- Alex Thompson's accounts
('6666ffff-6666-6666-6666-666666666666', 'ddddeeee-4444-5555-6666-777777777777', 'b1ffcd00-ad1c-5ef9-cc7e-7cc0ce491b22', '2001234567', 'Investment Account', 'current', 'GBP', 78900.25, 78900.25, 'active', null, null, null, 0),
('7777gggg-7777-7777-7777-777777777777', 'ddddeeee-4444-5555-6666-777777777777', 'b1ffcd00-ad1c-5ef9-cc7e-7cc0ce491b22', '2001234568', 'Savings Account', 'savings', 'GBP', 45000.00, 45000.00, 'active', 1.8, null, 5000, 10),
-- Lisa Wang's account
('8888hhhh-8888-8888-8888-888888888888', 'eeeeffff-5555-6666-7777-888888888888', 'b1ffcd00-ad1c-5ef9-cc7e-7cc0ce491b22', '2002345678', 'Startup Business Account', 'business', 'USD', 125000.00, 120000.00, 'active', null, 25000, null, 50);

-- Insert Accounts for SecureBank Pro clients
INSERT INTO accounts (id, client_id, msb_id, account_number, account_name, account_type, currency, balance, available_balance, status, interest_rate, overdraft_limit, minimum_balance, monthly_fee) VALUES
-- Robert Davis's accounts
('9999iiii-9999-9999-9999-999999999999', 'ffffgggg-6666-7777-8888-999999999999', 'c2ggde11-be2d-6gh0-dd8f-8dd1df502c33', '3001234567', 'Premium Checking', 'current', 'USD', 45000.00, 45000.00, 'active', null, 10000, null, 15),
('aaaajjjj-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ffffgggg-6666-7777-8888-999999999999', 'c2ggde11-be2d-6gh0-dd8f-8dd1df502c33', '3001234568', 'Investment Savings', 'savings', 'USD', 75000.00, 75000.00, 'active', 3.2, null, 2500, 0),
-- Jennifer Lee's account
('bbbbkkkk-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'gggghhhh-7777-8888-9999-aaaaaaaaaaaa', 'c2ggde11-be2d-6gh0-dd8f-8dd1df502c33', '3002345678', 'Tech Professional Account', 'current', 'USD', 32000.00, 32000.00, 'active', null, 5000, null, 0);

-- Insert Transaction Limits
INSERT INTO transaction_limits (client_id, msb_id, daily_limit, monthly_limit, per_transaction_limit, daily_used, monthly_used) VALUES
-- FinTech Solutions clients
('aaaabbbb-1111-2222-3333-444444444444', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 10000, 50000, 5000, 1500, 8500),
('bbbbcccc-2222-3333-4444-555555555555', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 25000, 100000, 15000, 5000, 25000),
('ccccdddd-3333-4444-5555-666666666666', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 5000, 25000, 2500, 0, 0),
-- Global Money Exchange clients
('ddddeeee-4444-5555-6666-777777777777', 'b1ffcd00-ad1c-5ef9-cc7e-7cc0ce491b22', 50000, 200000, 25000, 15000, 75000),
('eeeeffff-5555-6666-7777-888888888888', 'b1ffcd00-ad1c-5ef9-cc7e-7cc0ce491b22', 20000, 75000, 10000, 3000, 15000),
-- SecureBank Pro clients
('ffffgggg-6666-7777-8888-999999999999', 'c2ggde11-be2d-6gh0-dd8f-8dd1df502c33', 15000, 60000, 7500, 2000, 12000),
('gggghhhh-7777-8888-9999-aaaaaaaaaaaa', 'c2ggde11-be2d-6gh0-dd8f-8dd1df502c33', 8000, 35000, 4000, 800, 5500);

-- Insert Sample Transactions for FinTech Solutions
INSERT INTO transactions (id, msb_id, account_id, client_id, transaction_number, type, category, amount, currency, description, reference, status, requires_approval, payment_method, balance_after, risk_score, flags, created_at) VALUES
('txn11111-1111-1111-1111-111111111111', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '1111aaaa-1111-1111-1111-111111111111', 'aaaabbbb-1111-2222-3333-444444444444', 'TXN-FT-001', 'credit', 'deposit', 2500.00, 'USD', 'Salary Deposit - Monthly Pay', 'PAYROLL-2024-001', 'completed', false, 'ach', 25750.00, 15, '{}', '2024-01-15T10:30:00Z'),
('txn22222-2222-2222-2222-222222222222', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '1111aaaa-1111-1111-1111-111111111111', 'aaaabbbb-1111-2222-3333-444444444444', 'TXN-FT-002', 'debit', 'payment', -85.50, 'USD', 'Grocery Store Purchase', 'CARD-2024-002', 'completed', false, 'card', 23250.00, 10, '{}', '2024-01-14T18:45:00Z'),
('txn33333-3333-3333-3333-333333333333', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '3333cccc-3333-3333-3333-333333333333', 'bbbbcccc-2222-3333-4444-555555555555', 'TXN-FT-003', 'credit', 'deposit', 15000.00, 'USD', 'Business Revenue Deposit', 'DEPOSIT-2024-001', 'completed', false, 'wire', 85300.50, 45, '{"Large Deposit"}', '2024-01-14T16:45:00Z');

-- Insert Sample Transactions for Global Money Exchange
INSERT INTO transactions (id, msb_id, account_id, client_id, transaction_number, type, category, amount, currency, description, reference, status, requires_approval, payment_method, balance_after, risk_score, flags, created_at) VALUES
('txn44444-4444-4444-4444-444444444444', 'b1ffcd00-ad1c-5ef9-cc7e-7cc0ce491b22', '6666ffff-6666-6666-6666-666666666666', 'ddddeeee-4444-5555-6666-777777777777', 'TXN-GM-001', 'debit', 'transfer', -25000.00, 'GBP', 'International Wire Transfer', 'WIRE-2024-001', 'pending', true, 'wire', 78900.25, 85, '{"High Amount", "International", "Requires Approval"}', '2024-01-15T10:30:00Z'),
('txn55555-5555-5555-5555-555555555555', 'b1ffcd00-ad1c-5ef9-cc7e-7cc0ce491b22', '8888hhhh-8888-8888-8888-888888888888', 'eeeeffff-5555-6666-7777-888888888888', 'TXN-GM-002', 'debit', 'payment', -5000.00, 'USD', 'Equipment Purchase', 'PAYMENT-2024-001', 'completed', false, 'online', 120000.00, 30, '{}', '2024-01-13T14:22:00Z');

-- Insert Sample Transactions for SecureBank Pro
INSERT INTO transactions (id, msb_id, account_id, client_id, transaction_number, type, category, amount, currency, description, reference, status, requires_approval, payment_method, balance_after, risk_score, flags, created_at) VALUES
('txn66666-6666-6666-6666-666666666666', 'c2ggde11-be2d-6gh0-dd8f-8dd1df502c33', '9999iiii-9999-9999-9999-999999999999', 'ffffgggg-6666-7777-8888-999999999999', 'TXN-SB-001', 'credit', 'deposit', 8000.00, 'USD', 'Investment Return', 'INVEST-2024-001', 'completed', false, 'wire', 45000.00, 25, '{}', '2024-01-15T11:45:00Z'),
('txn77777-7777-7777-7777-777777777777', 'c2ggde11-be2d-6gh0-dd8f-8dd1df502c33', 'bbbbkkkk-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'gggghhhh-7777-8888-9999-aaaaaaaaaaaa', 'TXN-SB-002', 'credit', 'deposit', 4500.00, 'USD', 'Freelance Payment', 'FREELANCE-2024-001', 'completed', false, 'ach', 32000.00, 15, '{}', '2024-01-12T16:20:00Z');

-- Insert Beneficiaries
INSERT INTO beneficiaries (id, client_id, msb_id, name, account_number, bank_name, bank_code, country, type, email, is_verified, last_used) VALUES
('ben11111-1111-1111-1111-111111111111', 'aaaabbbb-1111-2222-3333-444444444444', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'John Smith', '9876543210', 'Same Bank', null, 'United States', 'internal', 'john.smith@email.com', true, '2024-01-10T00:00:00Z'),
('ben22222-2222-2222-2222-222222222222', 'bbbbcccc-2222-3333-4444-555555555555', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Alice Brown', '8765432109', 'First National Bank', 'FNB001', 'United States', 'domestic', 'alice.brown@email.com', true, '2024-01-08T00:00:00Z'),
('ben33333-3333-3333-3333-333333333333', 'ddddeeee-4444-5555-6666-777777777777', 'b1ffcd00-ad1c-5ef9-cc7e-7cc0ce491b22', 'Robert Wilson', 'GB29NWBK60161331926819', 'Barclays Bank UK', 'NWBKGB2L', 'United Kingdom', 'international', 'robert.wilson@email.com', true, '2024-01-05T00:00:00Z');

-- Insert Compliance Alerts
INSERT INTO compliance_alerts (id, msb_id, client_id, transaction_id, alert_type, severity, status, description, amount, assigned_to) VALUES
('alt11111-1111-1111-1111-111111111111', 'b1ffcd00-ad1c-5ef9-cc7e-7cc0ce491b22', 'ddddeeee-4444-5555-6666-777777777777', 'txn44444-4444-4444-4444-444444444444', 'suspicious_activity', 'high', 'open', 'Large international transfer requires review', 25000, '22222222-2222-2222-2222-222222222222'),
('alt22222-2222-2222-2222-222222222222', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'bbbbcccc-2222-3333-4444-555555555555', 'txn33333-3333-3333-3333-333333333333', 'large_transaction', 'medium', 'under_review', 'Business deposit exceeds normal pattern', 15000, '11111111-1111-1111-1111-111111111111'),
('alt33333-3333-3333-3333-333333333333', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'ccccdddd-3333-4444-5555-666666666666', null, 'kyc_review', 'low', 'open', 'KYC documentation requires completion', null, '11111111-1111-1111-1111-111111111111');

-- Insert Compliance Reports
INSERT INTO compliance_reports (id, msb_id, name, type, period_start, period_end, status, due_date) VALUES
('rpt11111-1111-1111-1111-111111111111', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Suspicious Activity Report - January 2024', 'sar', '2024-01-01', '2024-01-31', 'pending', '2024-01-30T23:59:59Z'),
('rpt22222-2222-2222-2222-222222222222', 'b1ffcd00-ad1c-5ef9-cc7e-7cc0ce491b22', 'Currency Transaction Report - Q4 2023', 'ctr', '2023-10-01', '2023-12-31', 'submitted', '2024-01-15T23:59:59Z'),
('rpt33333-3333-3333-3333-333333333333', 'c2ggde11-be2d-6gh0-dd8f-8dd1df502c33', 'KYC Summary Report - December 2023', 'kyc_summary', '2023-12-01', '2023-12-31', 'approved', '2024-01-10T23:59:59Z');

-- Insert Documents
INSERT INTO documents (id, client_id, msb_id, name, type, file_url, status, created_at) VALUES
('doc11111-1111-1111-1111-111111111111', 'aaaabbbb-1111-2222-3333-444444444444', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Driver License - Sarah Johnson', 'id_document', '/documents/sarah_dl.pdf', 'approved', '2024-01-01T00:00:00Z'),
('doc22222-2222-2222-2222-222222222222', 'bbbbcccc-2222-3333-4444-555555555555', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Passport - Michael Chen', 'id_document', '/documents/michael_passport.pdf', 'approved', '2023-12-15T00:00:00Z'),
('doc33333-3333-3333-3333-333333333333', 'ccccdddd-3333-4444-5555-666666666666', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Passport - Emma Rodriguez', 'id_document', '/documents/emma_passport.pdf', 'pending', '2024-01-14T00:00:00Z');

-- Insert Account Statements
INSERT INTO account_statements (id, account_id, client_id, msb_id, statement_number, period_start, period_end, type, status, file_size, transaction_count, opening_balance, closing_balance, total_credits, total_debits, download_count) VALUES
('stmt1111-1111-1111-1111-111111111111', '1111aaaa-1111-1111-1111-111111111111', 'aaaabbbb-1111-2222-3333-444444444444', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'STMT-FT-001', '2024-01-01', '2024-01-31', 'monthly', 'available', '2.4 MB', 45, 8500.00, 25750.00, 5200.00, 1250.00, 3),
('stmt2222-2222-2222-2222-222222222222', '6666ffff-6666-6666-6666-666666666666', 'ddddeeee-4444-5555-6666-777777777777', 'b1ffcd00-ad1c-5ef9-cc7e-7cc0ce491b22', 'STMT-GM-001', '2024-01-01', '2024-01-31', 'monthly', 'generating', '-', 23, 70300.50, 78900.25, 8599.75, 0, 0),
('stmt3333-3333-3333-3333-333333333333', '9999iiii-9999-9999-9999-999999999999', 'ffffgggg-6666-7777-8888-999999999999', 'c2ggde11-be2d-6gh0-dd8f-8dd1df502c33', 'STMT-SB-001', '2024-01-01', '2024-01-31', 'monthly', 'available', '1.9 MB', 18, 37000.00, 45000.00, 8000.00, 0, 1);

-- Insert Audit Logs
INSERT INTO audit_logs (msb_id, user_id, action, resource_type, resource_id, details, ip_address) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '11111111-1111-1111-1111-111111111111', 'LOGIN', 'user', '11111111-1111-1111-1111-111111111111', '{"success": true}', '192.168.1.100'),
('b1ffcd00-ad1c-5ef9-cc7e-7cc0ce491b22', '22222222-2222-2222-2222-222222222222', 'LOGIN', 'user', '22222222-2222-2222-2222-222222222222', '{"success": true}', '192.168.1.101'),
('c2ggde11-be2d-6gh0-dd8f-8dd1df502c33', '33333333-3333-3333-3333-333333333333', 'LOGIN', 'user', '33333333-3333-3333-3333-333333333333', '{"success": true}', '192.168.1.102'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '44444444-4444-4444-4444-444444444444', 'LOGIN', 'user', '44444444-4444-4444-4444-444444444444', '{"success": true}', '192.168.1.103'),
('b1ffcd00-ad1c-5ef9-cc7e-7cc0ce491b22', '77777777-7777-7777-7777-777777777777', 'VIEW_ACCOUNT', 'account', '6666ffff-6666-6666-6666-666666666666', '{}', '192.168.1.104');