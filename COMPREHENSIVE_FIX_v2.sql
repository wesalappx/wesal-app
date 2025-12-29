-- =============================================
-- COMPREHENSIVE FIX v2 - Run in Supabase SQL Editor
-- Fixes: Profiles 500 error, Health tracking, Streaks
-- =============================================

-- 1. FIX PROFILES RLS (500 Error)
-- =============================================
-- The profiles table might have overly restrictive policies

-- Allow users to see partner profiles (for pairing feature)
DROP POLICY IF EXISTS "Users can view partner profile" ON profiles;
CREATE POLICY "Users can view partner profile" ON profiles
    FOR SELECT USING (
        auth.uid() = id  -- Can see own profile
        OR EXISTS (
            SELECT 1 FROM couples
            WHERE status = 'ACTIVE'
            AND ((partner1_id = auth.uid() AND partner2_id = profiles.id)
                 OR (partner2_id = auth.uid() AND partner1_id = profiles.id))
        )
    );


-- 2. FIX HEALTH_TRACKING TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS health_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    couple_id UUID REFERENCES couples(id),
    last_period_date DATE,
    cycle_length INTEGER DEFAULT 28,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(couple_id)
);

ALTER TABLE health_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view health data" ON health_tracking;
DROP POLICY IF EXISTS "Users can insert health data" ON health_tracking;
DROP POLICY IF EXISTS "Users can update health data" ON health_tracking;

CREATE POLICY "Users can view health data" ON health_tracking
    FOR SELECT USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM couples WHERE id = couple_id
            AND (partner1_id = auth.uid() OR partner2_id = auth.uid())
        )
    );

CREATE POLICY "Users can insert health data" ON health_tracking
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM couples WHERE id = couple_id
            AND (partner1_id = auth.uid() OR partner2_id = auth.uid())
        )
    );

CREATE POLICY "Users can update health data" ON health_tracking
    FOR UPDATE USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM couples WHERE id = couple_id
            AND (partner1_id = auth.uid() OR partner2_id = auth.uid())
        )
    );


-- 3. FIX USER_CALENDAR_EVENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS user_calendar_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    couple_id UUID REFERENCES couples(id),
    title TEXT NOT NULL,
    type TEXT DEFAULT 'CUSTOM',
    scheduled_date DATE NOT NULL,
    scheduled_time TIME,
    reminder_enabled BOOLEAN DEFAULT TRUE,
    notes TEXT,
    is_recurring BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_calendar_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view calendar events" ON user_calendar_events;
DROP POLICY IF EXISTS "Users can insert calendar events" ON user_calendar_events;
DROP POLICY IF EXISTS "Users can update calendar events" ON user_calendar_events;
DROP POLICY IF EXISTS "Users can delete calendar events" ON user_calendar_events;

CREATE POLICY "Users can view calendar events" ON user_calendar_events
    FOR SELECT USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM couples WHERE id = couple_id
            AND (partner1_id = auth.uid() OR partner2_id = auth.uid())
        )
    );

CREATE POLICY "Users can insert calendar events" ON user_calendar_events
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM couples WHERE id = couple_id
            AND (partner1_id = auth.uid() OR partner2_id = auth.uid())
        )
    );

CREATE POLICY "Users can update calendar events" ON user_calendar_events
    FOR UPDATE USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM couples WHERE id = couple_id
            AND (partner1_id = auth.uid() OR partner2_id = auth.uid())
        )
    );

CREATE POLICY "Users can delete calendar events" ON user_calendar_events
    FOR DELETE USING (user_id = auth.uid());


-- 4. FIX STREAKS TABLE (Ensure INSERT/UPDATE policies)
-- =============================================
DROP POLICY IF EXISTS "Couple members can insert streaks" ON streaks;
DROP POLICY IF EXISTS "Couple members can update streaks" ON streaks;

CREATE POLICY "Couple members can insert streaks" ON streaks
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM couples WHERE id = couple_id
                AND (partner1_id = auth.uid() OR partner2_id = auth.uid()))
    );

CREATE POLICY "Couple members can update streaks" ON streaks
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM couples WHERE id = couple_id
                AND (partner1_id = auth.uid() OR partner2_id = auth.uid()))
    );


-- 5. VERIFY - Show table info
-- =============================================
SELECT 'profiles' as table_name, count(*) as policy_count FROM pg_policies WHERE tablename = 'profiles'
UNION ALL
SELECT 'health_tracking', count(*) FROM pg_policies WHERE tablename = 'health_tracking'
UNION ALL
SELECT 'user_calendar_events', count(*) FROM pg_policies WHERE tablename = 'user_calendar_events'
UNION ALL
SELECT 'streaks', count(*) FROM pg_policies WHERE tablename = 'streaks';
