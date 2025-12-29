-- FINAL CONSOLIDATED SCHEMA SCRIPT
-- Run this in Supabase SQL Editor to ensure all features work correctly.
-- This script is idempotent (safe to run multiple times).

-- ============================================
-- 1. CONFLICT RESOLUTION (Collaborative Mode)
-- ============================================

CREATE TABLE IF NOT EXISTS public.conflict_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE NOT NULL,
    initiator_id UUID REFERENCES public.profiles(id) NOT NULL,
    partner_id UUID REFERENCES public.profiles(id) NOT NULL,
    status TEXT DEFAULT 'initiated', -- initiated, joined, analyzing, resolved
    initiator_input TEXT,
    partner_input TEXT,
    ai_analysis JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

ALTER TABLE public.conflict_sessions ENABLE ROW LEVEL SECURITY;

-- Policies for Conflict Sessions
DROP POLICY IF EXISTS "Couple can view their conflict sessions" ON public.conflict_sessions;
CREATE POLICY "Couple can view their conflict sessions" ON public.conflict_sessions
    FOR SELECT USING (
        auth.uid() = initiator_id OR auth.uid() = partner_id
    );

DROP POLICY IF EXISTS "Couple can insert conflict sessions" ON public.conflict_sessions;
CREATE POLICY "Couple can insert conflict sessions" ON public.conflict_sessions
    FOR INSERT WITH CHECK (
        auth.uid() = initiator_id
    );

DROP POLICY IF EXISTS "Couple can update their conflict sessions" ON public.conflict_sessions;
CREATE POLICY "Couple can update their conflict sessions" ON public.conflict_sessions
    FOR UPDATE USING (
        auth.uid() = initiator_id OR auth.uid() = partner_id
    );

-- Enable Realtime for Conflict Sessions
ALTER PUBLICATION supabase_realtime ADD TABLE public.conflict_sessions;

-- ============================================
-- 2. USER ACHIEVEMENTS
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

DROP POLICY IF EXISTS "Users can view own achievements" ON public.user_achievements;
CREATE POLICY "Users can view own achievements" ON public.user_achievements
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own achievements" ON public.user_achievements;
CREATE POLICY "Users can insert own achievements" ON public.user_achievements
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own achievements" ON public.user_achievements;
CREATE POLICY "Users can update own achievements" ON public.user_achievements
    FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- 3. JOURNEY PROGRESS
-- ============================================

CREATE TABLE IF NOT EXISTS public.journey_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE NOT NULL,
    journey_type TEXT NOT NULL,
    completed_steps INT DEFAULT 0,
    total_steps INT DEFAULT 5,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    UNIQUE(couple_id, journey_type)
);

ALTER TABLE public.journey_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Couple can view journey progress" ON public.journey_progress;
CREATE POLICY "Couple can view journey progress" ON public.journey_progress
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.couples WHERE id = couple_id 
        AND (partner1_id = auth.uid() OR partner2_id = auth.uid())
    ));

DROP POLICY IF EXISTS "Couple can insert journey progress" ON public.journey_progress;
CREATE POLICY "Couple can insert journey progress" ON public.journey_progress
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM public.couples WHERE id = couple_id 
        AND (partner1_id = auth.uid() OR partner2_id = auth.uid())
    ));

DROP POLICY IF EXISTS "Couple can update journey progress" ON public.journey_progress;
CREATE POLICY "Couple can update journey progress" ON public.journey_progress
    FOR UPDATE USING (EXISTS (
        SELECT 1 FROM public.couples WHERE id = couple_id 
        AND (partner1_id = auth.uid() OR partner2_id = auth.uid())
    ));

-- ============================================
-- 4. GAME SESSIONS
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

DROP POLICY IF EXISTS "Couple can view game sessions" ON public.game_sessions;
CREATE POLICY "Couple can view game sessions" ON public.game_sessions
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.couples WHERE id = couple_id 
        AND (partner1_id = auth.uid() OR partner2_id = auth.uid())
    ));

DROP POLICY IF EXISTS "Couple can insert game sessions" ON public.game_sessions;
CREATE POLICY "Couple can insert game sessions" ON public.game_sessions
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM public.couples WHERE id = couple_id 
        AND (partner1_id = auth.uid() OR partner2_id = auth.uid())
    ));

-- ============================================
-- 5. NOTIFICATIONS (Ensure Existence)
-- ============================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL, -- e.g., 'conflict_invite', 'checkin_reminder'
    title TEXT,
    message TEXT,
    action_url TEXT,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert notifications" ON public.notifications;
CREATE POLICY "Users can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (auth.uid() = user_id); -- Self-notification
    -- Note: For cross-user notifications (partner to partner), you might need a broader policy or use a server-side function,
    -- but for now, allowing users to insert for themselves or their partner (if we adjusted the policy) is key.
    -- A simpler 'Allow All Authenticated Insert' might be needed if partners insert into each other's stream directly from client.
    -- Let's add a policy for partners to insert notifications for their spouse.

DROP POLICY IF EXISTS "Partners can insert notifications for each other" ON public.notifications;
CREATE POLICY "Partners can insert notifications for each other" ON public.notifications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.couples 
            WHERE (partner1_id = auth.uid() AND partner2_id = user_id)
               OR (partner2_id = auth.uid() AND partner1_id = user_id)
        )
        OR auth.uid() = user_id -- Allow self-insert too
    );

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Enable Realtime for Notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ============================================
-- 6. INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_journey_progress_couple ON public.journey_progress(couple_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_couple ON public.game_sessions(couple_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_played ON public.game_sessions(played_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id) WHERE read_at IS NULL;
