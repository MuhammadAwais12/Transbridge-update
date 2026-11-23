-- Migration: Add password_changed field to users table
-- This field tracks whether a client has changed their password since first login

ALTER TABLE users ADD COLUMN password_changed BOOLEAN DEFAULT FALSE;

-- Update existing users to have password_changed = true (they've been using the system)
UPDATE users SET password_changed = TRUE WHERE role = 'account_holder'; 