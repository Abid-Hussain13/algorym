-- Migration: starter_code text → jsonb, add sessions.language
-- Run this against the database

-- 1. Add language column to sessions (before we need it)
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS language text;

-- 2. Convert starter_code from text to jsonb
-- First, create a temporary column
ALTER TABLE questions ADD COLUMN starter_code_jsonb jsonb;

-- Migrate existing data: wrap text value in a JSON object keyed by languages[0]
UPDATE questions
SET starter_code_jsonb = jsonb_build_object(languages[0], starter_code)
WHERE starter_code IS NOT NULL AND starter_code != '';

-- Set nulls for questions without starter code
UPDATE questions
SET starter_code_jsonb = NULL
WHERE starter_code IS NULL OR starter_code = '';

-- Drop old column and rename new one
ALTER TABLE questions DROP COLUMN starter_code;
ALTER TABLE questions RENAME COLUMN starter_code_jsonb TO starter_code;
