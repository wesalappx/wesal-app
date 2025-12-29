-- Add privacy_settings column to profiles table
-- Run this in Supabase SQL Editor

-- Add the column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'privacy_settings') THEN
        ALTER TABLE profiles ADD COLUMN privacy_settings JSONB DEFAULT '{}';
    END IF;
END $$;

-- Verify
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'privacy_settings';
