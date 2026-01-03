-- Journey Progress Tables (Couple & User) + Unique Constraints
-- Run this in your Supabase SQL Editor

-- ============================================
-- USER JOURNEY PROGRESS (Individual)
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_journey_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    journey_type TEXT NOT NULL,
    completed_steps INT DEFAULT 0,
    total_steps INT DEFAULT 5,
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, journey_type)
);

ALTER TABLE public.user_journey_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress" ON public.user_journey_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" ON public.user_journey_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON public.user_journey_progress
    FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- COUPLE JOURNEY PROGRESS (Shared)
-- ============================================
CREATE TABLE IF NOT EXISTS public.journey_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE NOT NULL,
    journey_type TEXT NOT NULL,
    completed_steps INT DEFAULT 0,
    total_steps INT DEFAULT 5,
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(couple_id, journey_type)
);

ALTER TABLE public.journey_progress ENABLE ROW LEVEL SECURITY;

-- RLS: Users can access if they are part of the couple
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

-- If tables already exist but lack unique constraint, add them:
-- ALTER TABLE public.user_journey_progress ADD CONSTRAINT user_journey_progress_unique UNIQUE (user_id, journey_type);
-- ALTER TABLE public.journey_progress ADD CONSTRAINT journey_progress_unique UNIQUE (couple_id, journey_type);
