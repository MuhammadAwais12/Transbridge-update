-- Add length constraints to string columns to prevent very long strings
-- This migration adds VARCHAR length limits to prevent security vulnerabilities

-- Users table constraints
ALTER TABLE users 
ALTER COLUMN email TYPE VARCHAR(254),
ALTER COLUMN name TYPE VARCHAR(100),
ALTER COLUMN role TYPE VARCHAR(20),
ALTER COLUMN password_hash TYPE VARCHAR(255);

-- MSBs table constraints
ALTER TABLE msbs 
ALTER COLUMN name TYPE VARCHAR(100),
ALTER COLUMN domain TYPE VARCHAR(255),
ALTER COLUMN primary_color TYPE VARCHAR(7),
ALTER COLUMN secondary_color TYPE VARCHAR(7),
ALTER COLUMN accent_color TYPE VARCHAR(7),
ALTER COLUMN theme TYPE VARCHAR(20);

-- Clients table constraints
ALTER TABLE clients 
ALTER COLUMN blindpay_receiver_id TYPE VARCHAR(100),
ALTER COLUMN client_type TYPE VARCHAR(20),
ALTER COLUMN legal_name TYPE VARCHAR(200),
ALTER COLUMN doing_business_as TYPE VARCHAR(200),
ALTER COLUMN website TYPE VARCHAR(255),
ALTER COLUMN ip_address TYPE VARCHAR(45),
ALTER COLUMN address_1 TYPE VARCHAR(255),
ALTER COLUMN address_2 TYPE VARCHAR(255),
ALTER COLUMN city TYPE VARCHAR(100),
ALTER COLUMN state TYPE VARCHAR(100),
ALTER COLUMN postal_code TYPE VARCHAR(20),
ALTER COLUMN id_document_country TYPE VARCHAR(100),
ALTER COLUMN id_document_type TYPE VARCHAR(100),
ALTER COLUMN id_document_front TYPE VARCHAR(500),
ALTER COLUMN id_document_back TYPE VARCHAR(500),
ALTER COLUMN proof_of_address_type TYPE VARCHAR(100),
ALTER COLUMN proof_of_address_document TYPE VARCHAR(500),
ALTER COLUMN company_formation_document TYPE VARCHAR(500),
ALTER COLUMN proof_of_ownership_document TYPE VARCHAR(500),
ALTER COLUMN kyc_type TYPE VARCHAR(100),
ALTER COLUMN first_name TYPE VARCHAR(50),
ALTER COLUMN last_name TYPE VARCHAR(50),
ALTER COLUMN nationality TYPE VARCHAR(100),
ALTER COLUMN phone_number TYPE VARCHAR(20),
ALTER COLUMN id_type TYPE VARCHAR(100),
ALTER COLUMN id_number TYPE VARCHAR(100),
ALTER COLUMN occupation TYPE VARCHAR(100),
ALTER COLUMN source_of_funds TYPE VARCHAR(100),
ALTER COLUMN annual_income_range TYPE VARCHAR(100),
ALTER COLUMN kyc_status TYPE VARCHAR(20),
ALTER COLUMN risk_level TYPE VARCHAR(20);

-- Add comments to document the constraints
COMMENT ON COLUMN users.email IS 'Email address with RFC 5321 standard length limit (254 chars)';
COMMENT ON COLUMN users.password_hash IS 'Bcrypt hash with reasonable length limit (255 chars)';
COMMENT ON COLUMN users.name IS 'User name with reasonable length limit (100 chars)';
COMMENT ON COLUMN users.role IS 'User role with length limit (20 chars)';

COMMENT ON COLUMN msbs.name IS 'MSB name with reasonable length limit (100 chars)';
COMMENT ON COLUMN msbs.domain IS 'Domain name with standard length limit (255 chars)';
COMMENT ON COLUMN msbs.primary_color IS 'Hex color code with length limit (7 chars)';
COMMENT ON COLUMN msbs.secondary_color IS 'Hex color code with length limit (7 chars)';
COMMENT ON COLUMN msbs.accent_color IS 'Hex color code with length limit (7 chars)';
COMMENT ON COLUMN msbs.theme IS 'Theme name with length limit (20 chars)';

COMMENT ON COLUMN clients.first_name IS 'First name with reasonable length limit (50 chars)';
COMMENT ON COLUMN clients.last_name IS 'Last name with reasonable length limit (50 chars)';
COMMENT ON COLUMN clients.email IS 'Email address with RFC 5321 standard length limit (254 chars)';
COMMENT ON COLUMN clients.phone_number IS 'Phone number with length limit (20 chars)';
COMMENT ON COLUMN clients.address_1 IS 'Address line 1 with length limit (255 chars)';
COMMENT ON COLUMN clients.address_2 IS 'Address line 2 with length limit (255 chars)';
COMMENT ON COLUMN clients.city IS 'City name with length limit (100 chars)';
COMMENT ON COLUMN clients.state IS 'State/province with length limit (100 chars)';
COMMENT ON COLUMN clients.postal_code IS 'Postal code with length limit (20 chars)';
COMMENT ON COLUMN clients.ip_address IS 'IP address with length limit (45 chars for IPv6)';
COMMENT ON COLUMN clients.website IS 'Website URL with length limit (255 chars)';
COMMENT ON COLUMN clients.kyc_status IS 'KYC status with length limit (20 chars)';
COMMENT ON COLUMN clients.risk_level IS 'Risk level with length limit (20 chars)'; 