-- =============================================
-- REMOTE PAIRING SETUP
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Create active_sessions table
CREATE TABLE IF NOT EXISTS active_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL, -- 'journey', 'game', 'whisper'
    activity_id TEXT NOT NULL, -- 'communication', 'wyr', etc.
    mode TEXT NOT NULL CHECK (mode IN ('remote', 'local')),
    state JSONB DEFAULT '{}'::jsonb, -- Current step, answers, turn
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Partners can view their couple's sessions
CREATE POLICY "Partners can view session" ON active_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM couples
            WHERE id = active_sessions.couple_id
            AND (partner1_id = auth.uid() OR partner2_id = auth.uid())
        )
    );

-- Partners can create sessions for their couple
CREATE POLICY "Partners can create session" ON active_sessions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM couples
            WHERE id = couple_id
            AND (partner1_id = auth.uid() OR partner2_id = auth.uid())
        )
    );

-- Partners can update their couple's sessions
CREATE POLICY "Partners can update session" ON active_sessions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM couples
            WHERE id = active_sessions.couple_id
            AND (partner1_id = auth.uid() OR partner2_id = auth.uid())
        )
    );

-- Partners can delete their couple's sessions
CREATE POLICY "Partners can delete session" ON active_sessions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM couples
            WHERE id = active_sessions.couple_id
            AND (partner1_id = auth.uid() OR partner2_id = auth.uid())
        )
    );

-- 4. Realtime
-- Enable Realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE active_sessions;
