-- CALENDAR EVENTS TABLE
CREATE TABLE IF NOT EXISTS user_calendar_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    couple_id UUID REFERENCES couples(id),
    title TEXT NOT NULL,
    type TEXT CHECK (type IN ('JOURNEY', 'ACTIVITY', 'CHECK_IN', 'CUSTOM')) DEFAULT 'CUSTOM',
    scheduled_date DATE NOT NULL,
    scheduled_time TIME,
    reminder_enabled BOOLEAN DEFAULT TRUE,
    notes TEXT,
    is_recurring BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- HEALTH TRACKING TABLE (Cycle & Ovulation)
CREATE TABLE IF NOT EXISTS health_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    couple_id UUID REFERENCES couples(id),
    last_period_date DATE,
    cycle_length INTEGER DEFAULT 28,
    average_period_length INTEGER DEFAULT 5,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(couple_id) -- One record per couple (or per user if you prefer, but shared implies couple access)
);

-- Enable RLS
ALTER TABLE user_calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_tracking ENABLE ROW LEVEL SECURITY;

-- POLICIES: Calendar Events
DROP POLICY IF EXISTS "Couple members can view calendar events" ON user_calendar_events;
DROP POLICY IF EXISTS "Couple members can manage calendar events" ON user_calendar_events;

CREATE POLICY "Couple members can view calendar events" ON user_calendar_events
    FOR SELECT USING (
        (user_id = auth.uid()) OR
        (couple_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM couples
            WHERE id = user_calendar_events.couple_id
            AND (partner1_id = auth.uid() OR partner2_id = auth.uid())
        ))
    );

CREATE POLICY "Couple members can insert calendar events" ON user_calendar_events
    FOR INSERT WITH CHECK (
        (user_id = auth.uid()) OR
        (couple_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM couples
            WHERE id = couple_id
            AND (partner1_id = auth.uid() OR partner2_id = auth.uid())
        ))
    );

CREATE POLICY "Couple members can update calendar events" ON user_calendar_events
    FOR UPDATE USING (
        (user_id = auth.uid()) OR
        (couple_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM couples
            WHERE id = user_calendar_events.couple_id
            AND (partner1_id = auth.uid() OR partner2_id = auth.uid())
        ))
    );

CREATE POLICY "Couple members can delete calendar events" ON user_calendar_events
    FOR DELETE USING (
        (user_id = auth.uid()) OR
        (couple_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM couples
            WHERE id = user_calendar_events.couple_id
            AND (partner1_id = auth.uid() OR partner2_id = auth.uid())
        ))
    );

-- POLICIES: Health Tracking
DROP POLICY IF EXISTS "Couple members can view health data" ON health_tracking;
DROP POLICY IF EXISTS "Couple members can manage health data" ON health_tracking;

CREATE POLICY "Couple members can view health data" ON health_tracking
    FOR SELECT USING (
        (user_id = auth.uid()) OR
        (couple_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM couples
            WHERE id = health_tracking.couple_id
            AND (partner1_id = auth.uid() OR partner2_id = auth.uid())
        ))
    );

CREATE POLICY "Couple members can insert health data" ON health_tracking
    FOR INSERT WITH CHECK (
        (user_id = auth.uid()) OR
        (couple_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM couples
            WHERE id = couple_id
            AND (partner1_id = auth.uid() OR partner2_id = auth.uid())
        ))
    );

CREATE POLICY "Couple members can update health data" ON health_tracking
    FOR UPDATE USING (
        (user_id = auth.uid()) OR
        (couple_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM couples
            WHERE id = health_tracking.couple_id
            AND (partner1_id = auth.uid() OR partner2_id = auth.uid())
        ))
    );

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE user_calendar_events;
ALTER PUBLICATION supabase_realtime ADD TABLE health_tracking;
