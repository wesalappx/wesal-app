-- ============================================
-- FIX EXISTING SUBSCRIPTIONS
-- Run this in Supabase SQL Editor to fix any subscriptions
-- that were created with 'active' status
-- ============================================

-- First, check current subscriptions
SELECT id, couple_id, status, starts_at, ends_at, created_at
FROM subscriptions
ORDER BY created_at DESC
LIMIT 10;

-- Update any subscriptions with 'active' status to 'premium'
-- (This fixes the mismatch between API code and database schema)
UPDATE subscriptions
SET status = 'premium',
    updated_at = NOW()
WHERE status = 'active';

-- Verify the fix
SELECT id, couple_id, status, starts_at, ends_at, created_at
FROM subscriptions
ORDER BY created_at DESC
LIMIT 10;
