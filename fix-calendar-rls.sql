-- Fix Calendar RLS Policies
-- Run this in Supabase SQL Editor

-- First, enable RLS if not enabled
ALTER TABLE user_calendar_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own and couple events" ON user_calendar_events;
DROP POLICY IF EXISTS "Users can insert own events" ON user_calendar_events;
DROP POLICY IF EXISTS "Users can update own events" ON user_calendar_events;
DROP POLICY IF EXISTS "Users can delete own events" ON user_calendar_events;

-- Allow users to view their own events OR events from their couple
CREATE POLICY "Users can view own and couple events" ON user_calendar_events
FOR SELECT USING (
  auth.uid() = user_id 
  OR couple_id IN (
    SELECT id FROM couples 
    WHERE partner1_id = auth.uid() OR partner2_id = auth.uid()
  )
);

-- Allow users to insert their own events
CREATE POLICY "Users can insert own events" ON user_calendar_events
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own events
CREATE POLICY "Users can update own events" ON user_calendar_events
FOR UPDATE USING (auth.uid() = user_id);

-- Allow users to delete their own events
CREATE POLICY "Users can delete own events" ON user_calendar_events
FOR DELETE USING (auth.uid() = user_id);

-- Verify policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'user_calendar_events';
