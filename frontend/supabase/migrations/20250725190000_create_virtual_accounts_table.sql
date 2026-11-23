-- Create virtual_accounts table
CREATE TABLE IF NOT EXISTS virtual_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    blindpay_receiver_id VARCHAR(255) NOT NULL,
    blindpay_virtual_account_id VARCHAR(255) NOT NULL,
    account_number VARCHAR(255) NOT NULL,
    routing_number VARCHAR(255) NOT NULL,
    bank_name VARCHAR(255) DEFAULT 'BlindPay Bank',
    payment_rail VARCHAR(50) DEFAULT 'ach' CHECK (payment_rail IN ('ach', 'domestic_wire', 'international_wire', 'rtp')),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'suspended')),
    token VARCHAR(10) DEFAULT 'USDC',
    blockchain_wallet_id VARCHAR(255),
    balance DECIMAL(15,2) DEFAULT 0,
    available_balance DECIMAL(15,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    account_name VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_virtual_accounts_client_id ON virtual_accounts(client_id);
CREATE INDEX IF NOT EXISTS idx_virtual_accounts_blindpay_receiver_id ON virtual_accounts(blindpay_receiver_id);
CREATE INDEX IF NOT EXISTS idx_virtual_accounts_status ON virtual_accounts(status);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_virtual_accounts_updated_at 
    BEFORE UPDATE ON virtual_accounts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 