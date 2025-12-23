-- User Journey Progress & Calendar Tables
-- Run this in your Supabase SQL Editor to enable cross-device sync
-- This script handles existing objects safely

-- ============================================
-- USER JOURNEY PROGRESS (Per-User, syncs across devices)
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_journey_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    journey_type TEXT NOT NULL,
    completed_steps INT DEFAULT 0,
    total_steps INT DEFAULT 5,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, journey_type)
);

ALTER TABLE public.user_journey_progress ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then recreate
DROP POLICY IF EXISTS "Users can view own journey progress" ON public.user_journey_progress;
DROP POLICY IF EXISTS "Users can insert own journey progress" ON public.user_journey_progress;
DROP POLICY IF EXISTS "Users can update own journey progress" ON public.user_journey_progress;

CREATE POLICY "Users can view own journey progress" ON public.user_journey_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journey progress" ON public.user_journey_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journey progress" ON public.user_journey_progress
    FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_journey_progress_user_id ON public.user_journey_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_journey_progress_journey_type ON public.user_journey_progress(journey_type);

-- ============================================
-- COUPLE JOURNEY PROGRESS
-- ============================================

CREATE TABLE IF NOT EXISTS public.journey_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE NOT NULL,
    journey_type TEXT NOT NULL,
    completed_steps INT DEFAULT 0,
    total_steps INT DEFAULT 5,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(couple_id, journey_type)
);

ALTER TABLE public.journey_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Couple members can view journey progress" ON public.journey_progress;
DROP POLICY IF EXISTS "Couple members can insert journey progress" ON public.journey_progress;
DROP POLICY IF EXISTS "Couple members can update journey progress" ON public.journey_progress;

CREATE POLICY "Couple members can view journey progress" ON public.journey_progress
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.couples
            WHERE id = couple_id
            AND (partner1_id = auth.uid() OR partner2_id = auth.uid())
        )
    );

CREATE POLICY "Couple members can insert journey progress" ON public.journey_progress
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.couples
            WHERE id = couple_id
            AND (partner1_id = auth.uid() OR partner2_id = auth.uid())
        )
    );

CREATE POLICY "Couple members can update journey progress" ON public.journey_progress
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.couples
            WHERE id = couple_id
            AND (partner1_id = auth.uid() OR partner2_id = auth.uid())
        )
    );

CREATE INDEX IF NOT EXISTS idx_journey_progress_couple_id ON public.journey_progress(couple_id);

-- ============================================
-- USER CALENDAR EVENTS (Per-User, syncs across devices)
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_calendar_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    couple_id UUID REFERENCES public.couples(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    type TEXT DEFAULT 'CUSTOM' CHECK (type IN ('JOURNEY', 'ACTIVITY', 'CHECK_IN', 'CUSTOM')),
    scheduled_date DATE NOT NULL,
    scheduled_time TIME,
    reminder_enabled BOOLEAN DEFAULT TRUE,
    is_recurring BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_calendar_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own calendar events" ON public.user_calendar_events;
DROP POLICY IF EXISTS "Users can insert own calendar events" ON public.user_calendar_events;
DROP POLICY IF EXISTS "Users can update own calendar events" ON public.user_calendar_events;
DROP POLICY IF EXISTS "Users can delete own calendar events" ON public.user_calendar_events;

CREATE POLICY "Users can view own calendar events" ON public.user_calendar_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calendar events" ON public.user_calendar_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calendar events" ON public.user_calendar_events
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own calendar events" ON public.user_calendar_events
    FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_calendar_events_user_id ON public.user_calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_calendar_events_date ON public.user_calendar_events(scheduled_date);

-- ============================================
-- USER ACHIEVEMENTS (Per-User, syncs across devices)
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    achievement_type TEXT NOT NULL,
    progress INT DEFAULT 0,
    unlocked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, achievement_type)
);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own achievements" ON public.user_achievements;
DROP POLICY IF EXISTS "Users can insert own achievements" ON public.user_achievements;
DROP POLICY IF EXISTS "Users can update own achievements" ON public.user_achievements;

CREATE POLICY "Users can view own achievements" ON public.user_achievements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements" ON public.user_achievements
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own achievements" ON public.user_achievements
    FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);

