-- Run this SQL to add email verification and password reset support
-- psql -U postgres -d algorym -f apps/server/src/db/migrate.sql

-- Add email_verified column to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false;

-- Create token type enum
DO $$ BEGIN
    CREATE TYPE token_type AS ENUM ('email_verification', 'password_reset');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create tokens table
CREATE TABLE IF NOT EXISTS tokens (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users(id) on delete cascade,
    token text not null unique,
    type token_type not null,
    expires_at timestamptz not null,
    created_at timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS idx_tokens_user ON tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_tokens_token ON tokens(token);
