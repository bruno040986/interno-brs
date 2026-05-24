-- Migration to add birth_date to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date DATE;
