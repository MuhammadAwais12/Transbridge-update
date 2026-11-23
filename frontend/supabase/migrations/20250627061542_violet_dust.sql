/*
  # Seed Database with Comprehensive Dummy Data

  This migration populates the database with realistic test data for:
  - MSB entities
  - Users (MSB admins and clients)
  - Client profiles with KYC data
  - Multiple accounts per client
  - Transaction history
  - Beneficiaries
  - Compliance alerts and reports
  - Documents and statements
*/

-- Insert MSB
INSERT INTO msbs (id, name, domain, logo_url, primary_color, secondary_color, accent_color, settings) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'FinTech Solutions Ltd', 'banking.fintechsolutions.com', null, '#3b82f6', '#22c55e', '#f97316', 
 '{"requireTransactionApproval": true, "approvalThreshold": 10000, "allowInternationalTransfers": true, "mfaRequired": true, "sessionTimeout": 30}');

-- Insert Users (MSB Admin)
INSERT INTO users (id, msb_id, email, name, role, last_login) VALUES
('660e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', 'admin@fintechsolutions.com', 'John Smith', 'msb_admin', '2024-01-15T10:30:00Z');

-- Insert Client Users
INSERT INTO users (id, msb_id, email, name, role, last_login) VALUES
('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'sarah.johnson@email.com', 'Sarah Johnson', 'account_holder', '2024-01-15T10:30:00Z'),
('770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'michael.chen@business.com', 'Michael Chen', 'account_holder', '2024-01-14T16:45:00Z'),
('770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'emma.rodriguez@gmail.com', 'Emma Rodriguez', 'account_holder', null),
('770e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440000', 'david.thompson@corp.com', 'David Thompson', 'account_holder', '2024-01-10T09:15:00Z'),
('770e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440000', 'lisa.wang@startup.io', 'Lisa Wang', 'account_holder', '2024-01-13T14:22:00Z');

-- Insert Clients
INSERT INTO clients (id, user_id, msb_id, first_name, last_name, date_of_birth, nationality, phone_number, id_type, id_number, occupation, source_of_funds, annual_income_range, address, kyc_status, risk_level, kyc_completed_at) VALUES
('880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Sarah', 'Johnson', '1985-03-15', 'United States', '+1-555-123-4567', 'driver_license', 'DL123456789', 'Software Engineer', 'employment', '50k-100k', '{"street": "123 Main St", "city": "New York", "state": "NY", "postalCode": "10001", "country": "United States"}', 'approved', 'low', '2024-01-02T00:00:00Z'),
('880e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'Michael', 'Chen', '1978-11-22', 'Canada', '+1-555-987-6543', 'passport', 'P987654321', 'Business Owner', 'business', '100k-250k', '{"street": "456 Business Ave", "city": "Toronto", "state": "ON", "postalCode": "M5V 3A8", "country": "Canada"}', 'approved', 'medium', '2023-12-16T00:00:00Z'),
('880e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'Emma', 'Rodriguez', '1992-07-08', 'Mexico', '+1-555-456-7890', 'passport', 'P456789123', 'Marketing Manager', 'employment', '25k-50k', '{"street": "789 Oak St", "city": "Mexico City", "state": "CDMX", "postalCode": "01000", "country": "Mexico"}', 'requires_documents', 'low', null),
('880e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440000', 'David', 'Thompson', '1975-12-03', 'United Kingdom', '+44-20-7123-4567', 'passport', 'P321654987', 'Investment Banker', 'investments', '250k-500k', '{"street": "10 Downing St", "city": "London", "state": "England", "postalCode": "SW1A 2AA", "country": "United Kingdom"}', 'approved', 'high', '2023-11-21T00:00:00Z'),
('880e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440000', 'Lisa', 'Wang', '1988-09-14', 'United States', '+1-555-789-0123', 'driver_license', 'DL987654321', 'Tech Entrepreneur', 'business', '100k-250k', '{"street": "321 Innovation Dr", "city": "San Francisco", "state": "CA", "postalCode": "94105", "country": "United States"}', 'approved', 'medium', '2024-01-01T00:00:00Z');

-- Insert Accounts
INSERT INTO accounts (id, client_id, msb_id, account_number, account_name, account_type, currency, balance, available_balance, status, interest_rate, overdraft_limit, minimum_balance, monthly_fee) VALUES
-- Sarah Johnson's accounts
('990e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', '1234567890', 'Primary Checking', 'current', 'USD', 25750.00, 25750.00, 'active', null, 5000, null, 0),
('990e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', '1234567891', 'High Yield Savings', 'savings', 'USD', 20000.00, 20000.00, 'active', 2.5, null, 1000, 0),

-- Michael Chen's accounts
('990e8400-e29b-41d4-a716-446655440003', '880e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', '2345678901', 'Business Checking', 'business', 'USD', 85300.50, 85300.50, 'active', null, 15000, null, 25),
('990e8400-e29b-41d4-a716-446655440004', '880e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', '2345678902', 'Multi-Currency Account', 'multi_currency', 'CAD', 40000.00, 35000.00, 'active', null, 10000, null, 15),

-- Emma Rodriguez's account
('990e8400-e29b-41d4-a716-446655440005', '880e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', '3456789012', 'Current Account', 'current', 'USD', 0, 0, 'inactive', null, null, null, 0),

-- David Thompson's accounts
('990e8400-e29b-41d4-a716-446655440006', '880e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440000', '4567890123', 'Investment Account', 'current', 'GBP', 78900.25, 78900.25, 'frozen', null, null, null, 0),
('990e8400-e29b-41d4-a716-446655440007', '880e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440000', '4567890124', 'Savings Account', 'savings', 'GBP', 45000.00, 45000.00, 'active', 1.8, null, 5000, 10),

-- Lisa Wang's accounts
('990e8400-e29b-41d4-a716-446655440008', '880e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440000', '5678901234', 'Startup Business Account', 'business', 'USD', 125000.00, 120000.00, 'active', null, 25000, null, 50);

-- Insert Beneficiaries
INSERT INTO beneficiaries (id, client_id, msb_id, name, account_number, bank_name, bank_code, country, type, email, is_verified, last_used) VALUES
('aa0e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'John Smith', '9876543210', 'Same Bank', null, 'United States', 'internal', 'john.smith@email.com', true, '2024-01-10T00:00:00Z'),
('aa0e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Alice Brown', '8765432109', 'First National Bank', 'FNB001', 'United States', 'domestic', 'alice.brown@email.com', true, '2024-01-08T00:00:00Z'),
('aa0e8400-e29b-41d4-a716-446655440003', '880e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'Robert Wilson', 'GB29NWBK60161331926819', 'Barclays Bank UK', 'NWBKGB2L', 'United Kingdom', 'international', 'robert.wilson@email.com', true, '2024-01-05T00:00:00Z');

-- Insert Transaction Limits
INSERT INTO transaction_limits (client_id, msb_id, daily_limit, monthly_limit, per_transaction_limit, daily_used, monthly_used) VALUES
('880e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 10000, 50000, 5000, 1500, 8500),
('880e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 25000, 100000, 15000, 5000, 25000),
('880e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 5000, 25000, 2500, 0, 0),
('880e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440000', 50000, 200000, 25000, 15000, 75000),
('880e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440000', 20000, 75000, 10000, 3000, 15000);

-- Insert Transactions
INSERT INTO transactions (id, msb_id, account_id, client_id, transaction_number, type, category, amount, currency, description, reference, status, requires_approval, payment_method, balance_after, risk_score, flags, created_at) VALUES
('bb0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', '990e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440001', 'TXN-001', 'credit', 'deposit', 2500.00, 'USD', 'Salary Deposit - Monthly Pay', 'PAYROLL-2024-001', 'completed', false, 'ach', 25750.00, 15, '{}', '2024-01-15T10:30:00Z'),
('bb0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', '990e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440001', 'TXN-002', 'debit', 'payment', -85.50, 'USD', 'Grocery Store Purchase', 'CARD-2024-002', 'completed', false, 'card', 23250.00, 10, '{}', '2024-01-14T18:45:00Z'),
('bb0e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', '990e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440001', 'TXN-003', 'debit', 'transfer', -1200.00, 'USD', 'Rent Payment', 'TRANSFER-2024-003', 'completed', false, 'online', 23335.50, 20, '{}', '2024-01-13T09:00:00Z'),
('bb0e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440000', '990e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440001', 'TXN-004', 'credit', 'interest', 150.00, 'USD', 'Interest Payment - Savings Account', 'INT-2024-001', 'completed', false, null, 20000.00, 5, '{}', '2024-01-12T00:00:00Z'),
('bb0e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440000', '990e8400-e29b-41d4-a716-446655440003', '880e8400-e29b-41d4-a716-446655440002', 'TXN-005', 'credit', 'deposit', 15000.00, 'USD', 'Business Revenue Deposit', 'DEPOSIT-2024-001', 'completed', false, 'wire', 85300.50, 45, '{"Large Deposit"}', '2024-01-14T16:45:00Z'),
('bb0e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440000', '990e8400-e29b-41d4-a716-446655440006', '880e8400-e29b-41d4-a716-446655440004', 'TXN-006', 'debit', 'transfer', -25000.00, 'GBP', 'International Wire Transfer', 'WIRE-2024-001', 'pending', true, 'wire', 78900.25, 85, '{"High Amount", "International", "Requires Approval"}', '2024-01-15T10:30:00Z'),
('bb0e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440000', '990e8400-e29b-41d4-a716-446655440008', '880e8400-e29b-41d4-a716-446655440005', 'TXN-007', 'debit', 'payment', -5000.00, 'USD', 'Equipment Purchase', 'PAYMENT-2024-001', 'completed', false, 'online', 120000.00, 30, '{}', '2024-01-13T14:22:00Z');

-- Insert Compliance Alerts
INSERT INTO compliance_alerts (id, msb_id, client_id, transaction_id, alert_type, severity, status, description, amount, assigned_to) VALUES
('cc0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', '880e8400-e29b-41d4-a716-446655440004', 'bb0e8400-e29b-41d4-a716-446655440006', 'suspicious_activity', 'high', 'open', 'Large international transfer from frozen account', 25000, '660e8400-e29b-41d4-a716-446655440000'),
('cc0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', '880e8400-e29b-41d4-a716-446655440002', 'bb0e8400-e29b-41d4-a716-446655440005', 'large_transaction', 'medium', 'under_review', 'Business deposit exceeds normal pattern', 15000, '660e8400-e29b-41d4-a716-446655440000'),
('cc0e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', '880e8400-e29b-41d4-a716-446655440003', null, 'kyc_review', 'low', 'resolved', 'Annual KYC review completed', null, '660e8400-e29b-41d4-a716-446655440000'),
('cc0e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440000', '880e8400-e29b-41d4-a716-446655440004', null, 'aml_flag', 'critical', 'open', 'Client flagged for enhanced due diligence', null, null);

-- Insert Compliance Reports
INSERT INTO compliance_reports (id, msb_id, name, type, period_start, period_end, status, due_date) VALUES
('dd0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Suspicious Activity Report - January 2024', 'sar', '2024-01-01', '2024-01-31', 'pending', '2024-01-30T23:59:59Z'),
('dd0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'Currency Transaction Report - Q4 2023', 'ctr', '2023-10-01', '2023-12-31', 'submitted', '2024-01-15T23:59:59Z'),
('dd0e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'KYC Summary Report - December 2023', 'kyc_summary', '2023-12-01', '2023-12-31', 'approved', '2024-01-10T23:59:59Z');

-- Insert Documents
INSERT INTO documents (id, client_id, msb_id, name, type, file_url, status, created_at) VALUES
('ee0e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Driver License - Sarah Johnson', 'id_document', '/documents/sarah_dl.pdf', 'approved', '2024-01-01T00:00:00Z'),
('ee0e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Utility Bill - Sarah Johnson', 'proof_of_address', '/documents/sarah_utility.pdf', 'approved', '2024-01-01T00:00:00Z'),
('ee0e8400-e29b-41d4-a716-446655440003', '880e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'Passport - Michael Chen', 'id_document', '/documents/michael_passport.pdf', 'approved', '2023-12-15T00:00:00Z'),
('ee0e8400-e29b-41d4-a716-446655440004', '880e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'Passport - Emma Rodriguez', 'id_document', '/documents/emma_passport.pdf', 'pending', '2024-01-14T00:00:00Z');

-- Insert Account Statements
INSERT INTO account_statements (id, account_id, client_id, msb_id, statement_number, period_start, period_end, type, status, file_size, transaction_count, opening_balance, closing_balance, total_credits, total_debits, download_count) VALUES
('ff0e8400-e29b-41d4-a716-446655440001', '990e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'STMT-001', '2024-01-01', '2024-01-31', 'monthly', 'available', '2.4 MB', 45, 8500.00, 25750.00, 5200.00, 1250.00, 3),
('ff0e8400-e29b-41d4-a716-446655440002', '990e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'STMT-002', '2024-01-01', '2024-01-31', 'monthly', 'available', '1.8 MB', 8, 19850.00, 20000.00, 150.00, 0, 1),
('ff0e8400-e29b-41d4-a716-446655440003', '990e8400-e29b-41d4-a716-446655440003', '880e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'STMT-003', '2024-01-01', '2024-01-31', 'monthly', 'generating', '-', 23, 70300.50, 85300.50, 15000.00, 0, 0);

-- Insert Audit Logs
INSERT INTO audit_logs (msb_id, user_id, action, resource_type, resource_id, details, ip_address) VALUES
('550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440000', 'LOGIN', 'user', '660e8400-e29b-41d4-a716-446655440000', '{"success": true}', '192.168.1.100'),
('550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440000', 'VIEW_DASHBOARD', 'dashboard', null, '{}', '192.168.1.100'),
('550e8400-e29b-41d4-a716-446655440000', '770e8400-e29b-41d4-a716-446655440001', 'LOGIN', 'user', '770e8400-e29b-41d4-a716-446655440001', '{"success": true}', '192.168.1.101'),
('550e8400-e29b-41d4-a716-446655440000', '770e8400-e29b-41d4-a716-446655440001', 'VIEW_ACCOUNT', 'account', '990e8400-e29b-41d4-a716-446655440001', '{}', '192.168.1.101'),
('550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440000', 'APPROVE_TRANSACTION', 'transaction', 'bb0e8400-e29b-41d4-a716-446655440006', '{"previous_status": "pending", "new_status": "approved"}', '192.168.1.100');