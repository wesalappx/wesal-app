-- Supabase Schema for وصال (Wesal) Couples App
-- Run this in your Supabase SQL Editor

-- ============================================
-- PROFILES (extends auth.users)
-- ============================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    gender TEXT CHECK (gender IN ('MALE', 'FEMALE')),
    date_of_birth DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', 'مستخدم'));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- COUPLES (Partner Pairing)
-- ============================================

CREATE TABLE IF NOT EXISTS public.couples (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    partner1_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    partner2_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PAUSED', 'UNPAIRED')),
    paired_at TIMESTAMPTZ DEFAULT NOW(),
    unpaired_at TIMESTAMPTZ,
    UNIQUE(partner1_id),
    UNIQUE(partner2_id)
);

ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own couple" ON public.couples
    FOR SELECT USING (auth.uid() = partner1_id OR auth.uid() = partner2_id);

-- ============================================
-- PAIRING CODES
-- ============================================

CREATE TABLE IF NOT EXISTS public.pairing_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    used_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.pairing_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own codes" ON public.pairing_codes
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can create codes" ON public.pairing_codes
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Anyone can use valid codes" ON public.pairing_codes
    FOR UPDATE USING (used_at IS NULL AND expires_at > NOW());

-- ============================================
-- EMOTIONAL CHECK-INS
-- ============================================

CREATE TABLE IF NOT EXISTS public.check_ins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    mood INT CHECK (mood BETWEEN 1 AND 5) NOT NULL,
    energy INT CHECK (energy BETWEEN 1 AND 5) NOT NULL,
    stress INT CHECK (stress BETWEEN 1 AND 5) NOT NULL,
    sleep INT CHECK (sleep BETWEEN 1 AND 5),
    connection INT CHECK (connection BETWEEN 1 AND 5),
    shared_with_partner BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- Expire after 7 days for privacy
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own check-ins" ON public.check_ins
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own check-ins" ON public.check_ins
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- SCHEDULED SESSIONS (Calendar)
-- ============================================

CREATE TABLE IF NOT EXISTS public.scheduled_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    type TEXT CHECK (type IN ('JOURNEY', 'ACTIVITY', 'CHECK_IN', 'CUSTOM')) DEFAULT 'CUSTOM',
    scheduled_date DATE NOT NULL,
    scheduled_time TIME,
    reminder_enabled BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.scheduled_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Couple members can view sessions" ON public.scheduled_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.couples
            WHERE id = couple_id
            AND (partner1_id = auth.uid() OR partner2_id = auth.uid())
        )
    );

CREATE POLICY "Couple members can insert sessions" ON public.scheduled_sessions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.couples
            WHERE id = couple_id
            AND (partner1_id = auth.uid() OR partner2_id = auth.uid())
        )
    );

-- ============================================
-- STREAKS
-- ============================================

CREATE TABLE IF NOT EXISTS public.streaks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE UNIQUE NOT NULL,
    current_streak INT DEFAULT 0,
    longest_streak INT DEFAULT 0,
    last_activity_date DATE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Couple members can view streaks" ON public.streaks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.couples
            WHERE id = couple_id
            AND (partner1_id = auth.uid() OR partner2_id = auth.uid())
        )
    );

-- ============================================
-- NOTIFICATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL,
    title_ar TEXT NOT NULL,
    title_en TEXT,
    body_ar TEXT NOT NULL,
    body_en TEXT,
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Get partner for a user
CREATE OR REPLACE FUNCTION public.get_partner(user_id UUID)
RETURNS TABLE (
    id UUID,
    display_name TEXT,
    avatar_url TEXT,
    is_online BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.display_name,
        p.avatar_url,
        FALSE as is_online -- TODO: Implement real-time presence
    FROM public.profiles p
    JOIN public.couples c ON (
        (c.partner1_id = user_id AND c.partner2_id = p.id) OR
        (c.partner2_id = user_id AND c.partner1_id = p.id)
    )
    WHERE c.status = 'ACTIVE';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Generate 6-digit pairing code
CREATE OR REPLACE FUNCTION public.generate_pairing_code()
RETURNS TEXT AS $$
DECLARE
    new_code TEXT;
BEGIN
    LOOP
        new_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
        EXIT WHEN NOT EXISTS (
            SELECT 1 FROM public.pairing_codes 
            WHERE code = new_code AND expires_at > NOW()
        );
    END LOOP;
    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_check_ins_user_id ON public.check_ins(user_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_created_at ON public.check_ins(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_scheduled_sessions_couple_id ON public.scheduled_sessions(couple_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_sessions_date ON public.scheduled_sessions(scheduled_date);

-- ============================================
-- GAME SESSIONS (Online Play)
-- ============================================

CREATE TABLE IF NOT EXISTS public.game_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE NOT NULL,
    game_type TEXT NOT NULL, -- 'would-you-rather', 'compliment-battle', etc.
    status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('WAITING', 'ACTIVE', 'COMPLETED')),
    
    -- Game State (JSONB for flexibility across game types)
    current_state JSONB DEFAULT '{}'::JSONB, 
    -- Example: { "index": 0, "turn": "p1", "scores": {"p1":0, "p2":0}, "spin_result": null }
    
    last_action_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Couple members can view game sessions" ON public.game_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.couples
            WHERE id = couple_id
            AND (partner1_id = auth.uid() OR partner2_id = auth.uid())
        )
    );

CREATE POLICY "Couple members can update game sessions" ON public.game_sessions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.couples
            WHERE id = couple_id
            AND (partner1_id = auth.uid() OR partner2_id = auth.uid())
        )
    );

CREATE POLICY "Couple members can insert game sessions" ON public.game_sessions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.couples
            WHERE id = couple_id
            AND (partner1_id = auth.uid() OR partner2_id = auth.uid())
        )
    );

-- Enable Realtime for Game Sessions
alter publication supabase_realtime add table public.game_sessions;

