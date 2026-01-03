-- ============================================
-- COMPREHENSIVE DATABASE FIX SCRIPT
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. SUBSCRIPTIONS TABLE (Missing)
-- ============================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE NOT NULL,
    plan_id TEXT NOT NULL,
    status TEXT DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'cancelled', 'expired', 'premium')),
    payment_id TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Couple members can view subscriptions" ON public.subscriptions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.couples
            WHERE id = couple_id
            AND (partner1_id = auth.uid() OR partner2_id = auth.uid())
        )
    );

CREATE POLICY "Couple members can insert subscriptions" ON public.subscriptions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.couples
            WHERE id = couple_id
            AND (partner1_id = auth.uid() OR partner2_id = auth.uid())
        )
    );

CREATE POLICY "Couple members can update subscriptions" ON public.subscriptions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.couples
            WHERE id = couple_id
            AND (partner1_id = auth.uid() OR partner2_id = auth.uid())
        )
    );

-- ============================================
-- 2. JOURNEY PROGRESS TABLES + UNIQUE CONSTRAINTS
-- ============================================

-- User Journey Progress (Individual)
CREATE TABLE IF NOT EXISTS public.user_journey_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    journey_type TEXT NOT NULL,
    completed_steps INT DEFAULT 0,
    total_steps INT DEFAULT 5,
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add unique constraint (if table exists without it)
DO $$ BEGIN
    ALTER TABLE public.user_journey_progress ADD CONSTRAINT user_journey_progress_unique UNIQUE (user_id, journey_type);
EXCEPTION WHEN duplicate_table THEN NULL;
WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.user_journey_progress ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Users can view own progress" ON public.user_journey_progress;
DROP POLICY IF EXISTS "Users can insert own progress" ON public.user_journey_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON public.user_journey_progress;

CREATE POLICY "Users can view own progress" ON public.user_journey_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" ON public.user_journey_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON public.user_journey_progress
    FOR UPDATE USING (auth.uid() = user_id);

-- Couple Journey Progress (Shared)
CREATE TABLE IF NOT EXISTS public.journey_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE NOT NULL,
    journey_type TEXT NOT NULL,
    completed_steps INT DEFAULT 0,
    total_steps INT DEFAULT 5,
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add unique constraint (if table exists without it)
DO $$ BEGIN
    ALTER TABLE public.journey_progress ADD CONSTRAINT journey_progress_unique UNIQUE (couple_id, journey_type);
EXCEPTION WHEN duplicate_table THEN NULL;
WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.journey_progress ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
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

-- ============================================
-- 3. ADD USER_ID TO GAME_SESSIONS (for AI Coach queries)
-- ============================================
DO $$ BEGIN
    ALTER TABLE public.game_sessions ADD COLUMN user_id UUID REFERENCES public.profiles(id);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Update existing game_sessions to have user_id (set to partner1 of the couple as creator)
-- This is a one-time migration
UPDATE public.game_sessions gs
SET user_id = (SELECT partner1_id FROM public.couples WHERE id = gs.couple_id)
WHERE user_id IS NULL;

-- ============================================
-- 4. ADD SCORES COLUMN TO GAME_SESSIONS (for AI Coach queries)
-- ============================================
DO $$ BEGIN
    ALTER TABLE public.game_sessions ADD COLUMN scores JSONB DEFAULT '{}'::JSONB;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- ============================================
-- 5. FIX CHECK_INS RLS FOR PARTNER VIEWING
-- ============================================
-- Allow users to view check-ins shared with them (by partner)
DROP POLICY IF EXISTS "Users can view partner shared check-ins" ON public.check_ins;

CREATE POLICY "Users can view partner shared check-ins" ON public.check_ins
    FOR SELECT USING (
        auth.uid() = user_id
        OR (
            shared_with_partner = true
            AND EXISTS (
                SELECT 1 FROM public.couples
                WHERE status = 'ACTIVE'
                AND (
                    (partner1_id = auth.uid() AND partner2_id = user_id)
                    OR (partner2_id = auth.uid() AND partner1_id = user_id)
                )
            )
        )
    );

-- ============================================
-- 6. MESSAGES TABLE (Dashboard Chat)
-- ============================================
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Couple members can view messages" ON public.messages;
DROP POLICY IF EXISTS "Couple members can insert messages" ON public.messages;

CREATE POLICY "Couple members can view messages" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.couples
            WHERE id = couple_id
            AND (partner1_id = auth.uid() OR partner2_id = auth.uid())
        )
    );

CREATE POLICY "Couple members can insert messages" ON public.messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id
        AND EXISTS (
            SELECT 1 FROM public.couples
            WHERE id = couple_id
            AND (partner1_id = auth.uid() OR partner2_id = auth.uid())
        )
    );

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- ============================================
-- 7. INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_subscriptions_couple_id ON public.subscriptions(couple_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_journey_progress_couple_id ON public.journey_progress(couple_id);
CREATE INDEX IF NOT EXISTS idx_user_journey_progress_user_id ON public.user_journey_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_couple_id ON public.messages(couple_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

-- ============================================
-- 8. ACTIVE_SESSIONS TABLE (For Remote Play Invites)
-- ============================================
CREATE TABLE IF NOT EXISTS public.active_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE NOT NULL,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('game', 'journey')),
    activity_id TEXT NOT NULL, -- game type or journey id
    state JSONB DEFAULT '{}'::JSONB,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Couple members can view active sessions" ON public.active_sessions;
DROP POLICY IF EXISTS "Couple members can insert active sessions" ON public.active_sessions;
DROP POLICY IF EXISTS "Couple members can update active sessions" ON public.active_sessions;
DROP POLICY IF EXISTS "Couple members can delete active sessions" ON public.active_sessions;

CREATE POLICY "Couple members can view active sessions" ON public.active_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.couples
            WHERE id = couple_id
            AND (partner1_id = auth.uid() OR partner2_id = auth.uid())
        )
    );

CREATE POLICY "Couple members can insert active sessions" ON public.active_sessions
    FOR INSERT WITH CHECK (
        auth.uid() = created_by
        AND EXISTS (
            SELECT 1 FROM public.couples
            WHERE id = couple_id
            AND (partner1_id = auth.uid() OR partner2_id = auth.uid())
        )
    );

CREATE POLICY "Couple members can update active sessions" ON public.active_sessions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.couples
            WHERE id = couple_id
            AND (partner1_id = auth.uid() OR partner2_id = auth.uid())
        )
    );

CREATE POLICY "Couple members can delete active sessions" ON public.active_sessions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.couples
            WHERE id = couple_id
            AND (partner1_id = auth.uid() OR partner2_id = auth.uid())
        )
    );

-- Enable realtime for active_sessions
ALTER PUBLICATION supabase_realtime ADD TABLE public.active_sessions;

CREATE INDEX IF NOT EXISTS idx_active_sessions_couple_id ON public.active_sessions(couple_id);

-- ============================================
-- 9. ADD PRESENCE COLUMNS TO PROFILES
-- ============================================
DO $$ BEGIN
    ALTER TABLE public.profiles ADD COLUMN is_online BOOLEAN DEFAULT FALSE;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.profiles ADD COLUMN last_seen_at TIMESTAMPTZ DEFAULT NOW();
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Allow partners to view each other's online status
DROP POLICY IF EXISTS "Partners can view each other" ON public.profiles;
CREATE POLICY "Partners can view each other" ON public.profiles
    FOR SELECT USING (
        auth.uid() = id
        OR EXISTS (
            SELECT 1 FROM public.couples
            WHERE status = 'ACTIVE'
            AND (
                (partner1_id = auth.uid() AND partner2_id = id)
                OR (partner2_id = auth.uid() AND partner1_id = id)
            )
        )
    );

-- ============================================
-- DONE! All tables and constraints should now be fixed.
-- ============================================
