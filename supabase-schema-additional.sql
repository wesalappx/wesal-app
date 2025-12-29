-- Additional Schema for Production
-- Run this in Supabase SQL Editor AFTER the initial schema

-- ============================================
-- USER ACHIEVEMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    achievement_type TEXT NOT NULL,
    unlocked_at TIMESTAMPTZ,
    progress INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, achievement_type)
);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own achievements" ON public.user_achievements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements" ON public.user_achievements
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own achievements" ON public.user_achievements
    FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- JOURNEY PROGRESS
-- ============================================

CREATE TABLE IF NOT EXISTS public.journey_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE NOT NULL,
    journey_type TEXT NOT NULL,
    completed_steps INT DEFAULT 0,
    total_steps INT DEFAULT 5,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    UNIQUE(couple_id, journey_type)
);

ALTER TABLE public.journey_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Couple can view journey progress" ON public.journey_progress
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.couples WHERE id = couple_id 
        AND (partner1_id = auth.uid() OR partner2_id = auth.uid())
    ));

CREATE POLICY "Couple can insert journey progress" ON public.journey_progress
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM public.couples WHERE id = couple_id 
        AND (partner1_id = auth.uid() OR partner2_id = auth.uid())
    ));

CREATE POLICY "Couple can update journey progress" ON public.journey_progress
    FOR UPDATE USING (EXISTS (
        SELECT 1 FROM public.couples WHERE id = couple_id 
        AND (partner1_id = auth.uid() OR partner2_id = auth.uid())
    ));

-- ============================================
-- GAME SESSIONS (History)
-- ============================================

CREATE TABLE IF NOT EXISTS public.game_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE NOT NULL,
    game_type TEXT NOT NULL,
    played_at TIMESTAMPTZ DEFAULT NOW(),
    duration_minutes INT,
    score JSONB
);

ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Couple can view game sessions" ON public.game_sessions
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.couples WHERE id = couple_id 
        AND (partner1_id = auth.uid() OR partner2_id = auth.uid())
    ));

CREATE POLICY "Couple can insert game sessions" ON public.game_sessions
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM public.couples WHERE id = couple_id 
        AND (partner1_id = auth.uid() OR partner2_id = auth.uid())
    ));

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_journey_progress_couple ON public.journey_progress(couple_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_couple ON public.game_sessions(couple_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_played ON public.game_sessions(played_at DESC);
