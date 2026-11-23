/*
  # Enable public access to demo credentials table

  1. Security Changes
    - Disable RLS on demo_credentials table to allow public read access
    - This is safe for demo data as it contains no sensitive information
    
  2. Notes
    - Demo credentials are meant to be publicly accessible for demonstration purposes
    - No authentication required to view demo login options
*/

-- Disable RLS on demo_credentials table to allow public access
ALTER TABLE demo_credentials DISABLE ROW LEVEL SECURITY;

-- Ensure the table has some demo data
INSERT INTO demo_credentials (email, name, user_type, company_name, company_domain, password_hint) 
VALUES 
  ('admin@fintech.demo', 'MSB Administrator', 'msb_admin', 'Demo FinTech MSB', 'fintech.demo', 'demo123'),
  ('client@example.com', 'John Doe', 'client', NULL, NULL, 'demo123')
ON CONFLICT (email) DO NOTHING;