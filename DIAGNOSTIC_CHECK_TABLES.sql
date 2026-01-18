-- ============================================
-- DIAGNOSTIC: Check what tables/columns exist
-- Run this first to see the actual state
-- ============================================

-- Check if tables exist and what columns they have
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('secret_sparks', 'game_sessions', 'check_ins', 'journey_progress', 'notes', 'couples')
ORDER BY table_name, ordinal_position;
