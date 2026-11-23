/*
  # Enhanced Schema for MSB Banking Platform

  1. New Tables
    - `notifications` - For user notifications
    - `transaction_fees` - For tracking fees associated with transactions
    - `exchange_rates` - For multi-currency support
    - `login_history` - For security auditing

  2. Enhancements
    - Added missing indexes for performance
    - Added notification triggers
    - Added transaction fee calculation
    - Enhanced security with additional RLS policies

  3. Features
    - Complete notification system
    - Transaction fee tracking
    - Multi-currency support
    - Enhanced security auditing
*/

-- Notifications table for user alerts
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  msb_id uuid REFERENCES msbs(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}',
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Transaction fees table
CREATE TABLE IF NOT EXISTS transaction_fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid REFERENCES transactions(id) ON DELETE CASCADE,
  msb_id uuid REFERENCES msbs(id) ON DELETE CASCADE,
  fee_type text NOT NULL,
  amount decimal(15,2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  description text,
  created_at timestamptz DEFAULT now()
);

-- Exchange rates table for multi-currency support
CREATE TABLE IF NOT EXISTS exchange_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  msb_id uuid REFERENCES msbs(id) ON DELETE CASCADE,
  from_currency text NOT NULL,
  to_currency text NOT NULL,
  rate decimal(20,10) NOT NULL,
  effective_date date NOT NULL,
  expiry_date date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(msb_id, from_currency, to_currency, effective_date)
);

-- Login history for security auditing
CREATE TABLE IF NOT EXISTS login_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  msb_id uuid REFERENCES msbs(id) ON DELETE CASCADE,
  ip_address inet,
  user_agent text,
  device_info jsonb DEFAULT '{}',
  success boolean NOT NULL,
  failure_reason text,
  created_at timestamptz DEFAULT now()
);

-- Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_msb_id ON notifications(msb_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_transaction_fees_transaction_id ON transaction_fees(transaction_id);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_currencies ON exchange_rates(from_currency, to_currency);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_effective_date ON exchange_rates(effective_date);
CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_created_at ON login_history(created_at);

-- Enable Row Level Security on new tables
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for MSB Admins
CREATE POLICY "MSB admins can view all notifications in their MSB" ON notifications
  FOR SELECT TO authenticated
  USING (msb_id IN (
    SELECT msb_id FROM users WHERE id = auth.uid() AND role = 'msb_admin'
  ));

CREATE POLICY "MSB admins can manage transaction fees in their MSB" ON transaction_fees
  FOR ALL TO authenticated
  USING (msb_id IN (
    SELECT msb_id FROM users WHERE id = auth.uid() AND role = 'msb_admin'
  ));

CREATE POLICY "MSB admins can manage exchange rates in their MSB" ON exchange_rates
  FOR ALL TO authenticated
  USING (msb_id IN (
    SELECT msb_id FROM users WHERE id = auth.uid() AND role = 'msb_admin'
  ));

CREATE POLICY "MSB admins can view login history in their MSB" ON login_history
  FOR SELECT TO authenticated
  USING (msb_id IN (
    SELECT msb_id FROM users WHERE id = auth.uid() AND role = 'msb_admin'
  ));

-- RLS Policies for Clients
CREATE POLICY "Clients can view their own notifications" ON notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Function to create transaction notifications
CREATE OR REPLACE FUNCTION create_transaction_notification()
RETURNS TRIGGER AS $$
DECLARE
  client_user_id uuid;
  notification_title text;
  notification_message text;
  notification_type text;
BEGIN
  -- Get the client's user_id
  SELECT user_id INTO client_user_id
  FROM clients
  WHERE id = NEW.client_id;
  
  -- Set notification details based on status
  CASE NEW.status
    WHEN 'approved' THEN
      notification_type := 'transaction_approved';
      notification_title := 'Transaction Approved';
      notification_message := 'Your transaction of ' || 
                             CASE WHEN NEW.currency = 'USD' THEN '$' 
                                  WHEN NEW.currency = 'EUR' THEN '€'
                                  WHEN NEW.currency = 'GBP' THEN '£'
                                  ELSE NEW.currency || ' ' END || 
                             ABS(NEW.amount)::text || ' has been approved.';
    WHEN 'rejected' THEN
      notification_type := 'transaction_rejected';
      notification_title := 'Transaction Rejected';
      notification_message := 'Your transaction of ' || 
                             CASE WHEN NEW.currency = 'USD' THEN '$' 
                                  WHEN NEW.currency = 'EUR' THEN '€'
                                  WHEN NEW.currency = 'GBP' THEN '£'
                                  ELSE NEW.currency || ' ' END || 
                             ABS(NEW.amount)::text || ' has been rejected.';
    WHEN 'completed' THEN
      notification_type := 'transaction_completed';
      notification_title := 'Transaction Completed';
      notification_message := 'Your transaction of ' || 
                             CASE WHEN NEW.currency = 'USD' THEN '$' 
                                  WHEN NEW.currency = 'EUR' THEN '€'
                                  WHEN NEW.currency = 'GBP' THEN '£'
                                  ELSE NEW.currency || ' ' END || 
                             ABS(NEW.amount)::text || ' has been completed successfully.';
    WHEN 'failed' THEN
      notification_type := 'transaction_failed';
      notification_title := 'Transaction Failed';
      notification_message := 'Your transaction of ' || 
                             CASE WHEN NEW.currency = 'USD' THEN '$' 
                                  WHEN NEW.currency = 'EUR' THEN '€'
                                  WHEN NEW.currency = 'GBP' THEN '£'
                                  ELSE NEW.currency || ' ' END || 
                             ABS(NEW.amount)::text || ' has failed.';
    ELSE
      RETURN NEW;
  END CASE;
  
  -- Only create notification if status changed and we have a client user ID
  IF OLD.status IS DISTINCT FROM NEW.status AND client_user_id IS NOT NULL THEN
    INSERT INTO notifications (
      user_id,
      msb_id,
      type,
      title,
      message,
      data,
      read,
      created_at
    ) VALUES (
      client_user_id,
      NEW.msb_id,
      notification_type,
      notification_title,
      notification_message,
      jsonb_build_object(
        'transaction_id', NEW.id,
        'transaction_number', NEW.transaction_number,
        'amount', NEW.amount,
        'currency', NEW.currency
      ),
      false,
      now()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for transaction status changes
DROP TRIGGER IF EXISTS transaction_notification_trigger ON transactions;
CREATE TRIGGER transaction_notification_trigger
AFTER UPDATE OF status ON transactions
FOR EACH ROW
EXECUTE FUNCTION create_transaction_notification();

-- Function to calculate and record transaction fees
CREATE OR REPLACE FUNCTION calculate_transaction_fee()
RETURNS TRIGGER AS $$
DECLARE
  fee_amount decimal(15,2);
  fee_description text;
BEGIN
  -- Skip for certain transaction types
  IF NEW.category IN ('interest', 'fee') THEN
    RETURN NEW;
  END IF;
  
  -- Calculate fee based on transaction type and category
  CASE
    WHEN NEW.category = 'transfer' AND NEW.type = 'debit' THEN
      IF NEW.payment_method = 'wire' THEN
        fee_amount := GREATEST(15.00, ABS(NEW.amount) * 0.01);
        fee_description := 'Wire transfer fee';
      ELSE
        fee_amount := 2.50;
        fee_description := 'Standard transfer fee';
      END IF;
    WHEN NEW.category = 'withdrawal' THEN
      fee_amount := 1.00;
      fee_description := 'Withdrawal fee';
    ELSE
      fee_amount := 0;
      fee_description := 'No fee';
  END CASE;
  
  -- Only insert fee if amount > 0
  IF fee_amount > 0 THEN
    INSERT INTO transaction_fees (
      transaction_id,
      msb_id,
      fee_type,
      amount,
      currency,
      description,
      created_at
    ) VALUES (
      NEW.id,
      NEW.msb_id,
      CASE
        WHEN NEW.payment_method = 'wire' THEN 'wire_fee'
        WHEN NEW.category = 'withdrawal' THEN 'withdrawal_fee'
        ELSE 'standard_fee'
      END,
      fee_amount,
      NEW.currency,
      fee_description,
      now()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for transaction fee calculation
DROP TRIGGER IF EXISTS transaction_fee_trigger ON transactions;
CREATE TRIGGER transaction_fee_trigger
AFTER INSERT ON transactions
FOR EACH ROW
EXECUTE FUNCTION calculate_transaction_fee();

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for exchange rates updated_at
CREATE TRIGGER update_exchange_rates_updated_at
BEFORE UPDATE ON exchange_rates
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Insert some initial exchange rates
INSERT INTO exchange_rates (msb_id, from_currency, to_currency, rate, effective_date) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'USD', 'EUR', 0.92, CURRENT_DATE),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'USD', 'GBP', 0.79, CURRENT_DATE),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'EUR', 'USD', 1.09, CURRENT_DATE),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'GBP', 'USD', 1.27, CURRENT_DATE),
('b1ffcd00-ad1c-5ef9-cc7e-7cc0ce491b22', 'USD', 'EUR', 0.92, CURRENT_DATE),
('b1ffcd00-ad1c-5ef9-cc7e-7cc0ce491b22', 'USD', 'GBP', 0.79, CURRENT_DATE),
('c2eede11-be2d-6ef0-dd8f-8dd1df502c33', 'USD', 'EUR', 0.92, CURRENT_DATE),
('c2eede11-be2d-6ef0-dd8f-8dd1df502c33', 'USD', 'GBP', 0.79, CURRENT_DATE);