-- Add beneficiary type and business-specific fields to beneficiaries table
-- Migration: 20250731000001_add_beneficiary_type_and_business_fields

-- Add beneficiary_type column with default value
ALTER TABLE beneficiaries 
ADD COLUMN beneficiary_type VARCHAR(20) DEFAULT 'individual' NOT NULL;

-- Add individual-specific KYC fields
ALTER TABLE beneficiaries 
ADD COLUMN date_of_birth VARCHAR(10),
ADD COLUMN id_document_country VARCHAR(100),
ADD COLUMN id_document_type VARCHAR(100),
ADD COLUMN id_document_front VARCHAR(500),
ADD COLUMN id_document_back VARCHAR(500);

-- Add business-specific fields
ALTER TABLE beneficiaries 
ADD COLUMN legal_name VARCHAR(100),
ADD COLUMN formation_date VARCHAR(10),
ADD COLUMN website VARCHAR(255),
ADD COLUMN owners JSONB;

-- Add comments for documentation
COMMENT ON COLUMN beneficiaries.beneficiary_type IS 'Type of beneficiary: individual or business';
COMMENT ON COLUMN beneficiaries.date_of_birth IS 'Date of birth for individual beneficiaries (YYYY-MM-DD)';
COMMENT ON COLUMN beneficiaries.id_document_country IS 'Country of ID document for individual beneficiaries';
COMMENT ON COLUMN beneficiaries.id_document_type IS 'Type of ID document for individual beneficiaries';
COMMENT ON COLUMN beneficiaries.id_document_front IS 'Front side of ID document file name';
COMMENT ON COLUMN beneficiaries.id_document_back IS 'Back side of ID document file name';
COMMENT ON COLUMN beneficiaries.legal_name IS 'Legal business name for business beneficiaries';
COMMENT ON COLUMN beneficiaries.formation_date IS 'Business formation date (YYYY-MM-DD)';
COMMENT ON COLUMN beneficiaries.website IS 'Business website URL';
COMMENT ON COLUMN beneficiaries.owners IS 'JSON array of business owners/UBOs'; 