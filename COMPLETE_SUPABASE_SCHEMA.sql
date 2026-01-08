-- ============================================================================
-- WESAL (وصال) COMPLETE SUPABASE SCHEMA
-- ============================================================================
-- RUN THIS ENTIRE FILE IN YOUR SUPABASE SQL EDITOR
-- This is safe to run multiple times (uses IF NOT EXISTS and DROP IF EXISTS)
-- ============================================================================

-- ============================================
-- 1. PROFILES (extends auth.users)
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

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', 'مستخدم'))
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 2. COUPLES (Partner Pairing)
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

DROP POLICY IF EXISTS "Users can view own couple" ON public.couples;
CREATE POLICY "Users can view own couple" ON public.couples
    FOR SELECT USING (auth.uid() = partner1_id OR auth.uid() = partner2_id);

DROP POLICY IF EXISTS "Users can insert couple" ON public.couples;
CREATE POLICY "Users can insert couple" ON public.couples
    FOR INSERT WITH CHECK (auth.uid() = partner1_id OR auth.uid() = partner2_id);

-- ============================================
-- 3. PAIRING CODES
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

DROP POLICY IF EXISTS "Users can view own codes" ON public.pairing_codes;
CREATE POLICY "Users can view own codes" ON public.pairing_codes
    FOR SELECT USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can create codes" ON public.pairing_codes;
CREATE POLICY "Users can create codes" ON public.pairing_codes
    FOR INSERT WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Anyone can use valid codes" ON public.pairing_codes;
CREATE POLICY "Anyone can use valid codes" ON public.pairing_codes
    FOR UPDATE USING (used_at IS NULL AND expires_at > NOW());

-- ============================================
-- 4. EMOTIONAL CHECK-INS
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
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own check-ins" ON public.check_ins;
CREATE POLICY "Users can view own check-ins" ON public.check_ins
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own check-ins" ON public.check_ins;
CREATE POLICY "Users can insert own check-ins" ON public.check_ins
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 5. STREAKS
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

DROP POLICY IF EXISTS "Couple members can view streaks" ON public.streaks;
CREATE POLICY "Couple members can view streaks" ON public.streaks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.couples
            WHERE id = couple_id
            AND (partner1_id = auth.uid() OR partner2_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Couple members can update streaks" ON public.streaks;
CREATE POLICY "Couple members can update streaks" ON public.streaks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.couples
            WHERE id = couple_id
            AND (partner1_id = auth.uid() OR partner2_id = auth.uid())
        )
    );

-- ============================================
-- 6. NOTIFICATIONS
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

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- 7. MESSAGES (Dashboard Chat)
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
CREATE POLICY "Couple members can view messages" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.couples
            WHERE id = couple_id
            AND (partner1_id = auth.uid() OR partner2_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Couple members can insert messages" ON public.messages;
CREATE POLICY "Couple members can insert messages" ON public.messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.couples
            WHERE id = couple_id
            AND (partner1_id = auth.uid() OR partner2_id = auth.uid())
        )
        AND sender_id = auth.uid()
    );

-- ============================================
-- 8. GAME SESSIONS
-- ============================================

CREATE TABLE IF NOT EXISTS public.game_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE NOT NULL,
    game_type TEXT NOT NULL,
    status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('WAITING', 'ACTIVE', 'COMPLETED')),
    current_state JSONB DEFAULT '{}'::JSONB,
    last_action_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Couple members can manage game sessions" ON public.game_sessions;
CREATE POLICY "Couple members can manage game sessions" ON public.game_sessions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.couples
            WHERE id = couple_id
            AND (partner1_id = auth.uid() OR partner2_id = auth.uid())
        )
    );

-- ============================================
-- 9. ACTIVE SESSIONS (Real-time sync)
-- ============================================

CREATE TABLE IF NOT EXISTS public.active_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE NOT NULL,
    activity_type TEXT NOT NULL, -- 'game', 'journey', 'conflict'
    activity_id TEXT NOT NULL,
    started_by UUID REFERENCES public.profiles(id) NOT NULL,
    current_state JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Couple members can manage active sessions" ON public.active_sessions;
CREATE POLICY "Couple members can manage active sessions" ON public.active_sessions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.couples
            WHERE id = couple_id
            AND (partner1_id = auth.uid() OR partner2_id = auth.uid())
        )
    );

-- ============================================
-- 10. JOURNEY PROGRESS
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

DROP POLICY IF EXISTS "Users can manage own journey progress" ON public.user_journey_progress;
CREATE POLICY "Users can manage own journey progress" ON public.user_journey_progress
    FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 11. CALENDAR EVENTS
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

DROP POLICY IF EXISTS "Users can manage own calendar events" ON public.user_calendar_events;
CREATE POLICY "Users can manage own calendar events" ON public.user_calendar_events
    FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 12. ACHIEVEMENTS
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

DROP POLICY IF EXISTS "Users can manage own achievements" ON public.user_achievements;
CREATE POLICY "Users can manage own achievements" ON public.user_achievements
    FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 13. ADMIN USERS
-- ============================================

CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    role TEXT DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'moderator', 'viewer')),
    permissions JSONB DEFAULT '{"users": true, "couples": true, "content": true, "settings": false}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can manage admin_users" ON public.admin_users;
CREATE POLICY "Super admins can manage admin_users" ON public.admin_users
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid() AND au.role = 'super_admin')
    );

DROP POLICY IF EXISTS "Admins can view own profile" ON public.admin_users;
CREATE POLICY "Admins can view own profile" ON public.admin_users
    FOR SELECT USING (user_id = auth.uid());

-- ============================================
-- 14. ADMIN OTPs (For admin login)
-- ============================================

CREATE TABLE IF NOT EXISTS public.admin_otps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '10 minutes'),
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.admin_otps ENABLE ROW LEVEL SECURITY;

-- Allow service role only (API access)
DROP POLICY IF EXISTS "Service role access" ON public.admin_otps;
CREATE POLICY "Service role access" ON public.admin_otps
    FOR ALL USING (true);

-- ============================================
-- 15. APP SETTINGS (Dynamic Config)
-- ============================================

CREATE TABLE IF NOT EXISTS public.app_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general',
    updated_by UUID,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_settings' AND column_name = 'description') THEN
        ALTER TABLE public.app_settings ADD COLUMN description TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_settings' AND column_name = 'category') THEN
        ALTER TABLE public.app_settings ADD COLUMN category TEXT DEFAULT 'general';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_settings' AND column_name = 'updated_by') THEN
        ALTER TABLE public.app_settings ADD COLUMN updated_by UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_settings' AND column_name = 'updated_at') THEN
        ALTER TABLE public.app_settings ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_settings' AND column_name = 'created_at') THEN
        ALTER TABLE public.app_settings ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings (needed for games config)
DROP POLICY IF EXISTS "Anyone can read app settings" ON public.app_settings;
CREATE POLICY "Anyone can read app settings" ON public.app_settings
    FOR SELECT USING (true);

-- Service role can manage settings (API access)
DROP POLICY IF EXISTS "Service role can manage settings" ON public.app_settings;
CREATE POLICY "Service role can manage settings" ON public.app_settings
    FOR ALL USING (true);

-- Insert default settings (only key and value required)
INSERT INTO public.app_settings (key, value) VALUES
    ('premium_price', '50'::JSONB),
    ('maintenance_mode', 'false'::JSONB)
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- 16. ADMIN AUDIT LOG
-- ============================================

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID,
    admin_email TEXT,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id TEXT,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view audit log" ON public.admin_audit_log;
CREATE POLICY "Admins can view audit log" ON public.admin_audit_log
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Allow insert audit log" ON public.admin_audit_log;
CREATE POLICY "Allow insert audit log" ON public.admin_audit_log
    FOR INSERT WITH CHECK (true);

-- ============================================
-- 17. SUBSCRIPTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE NOT NULL UNIQUE,
    status TEXT DEFAULT 'trial' CHECK (status IN ('trial', 'premium', 'expired')),
    plan_type TEXT DEFAULT 'lifetime' CHECK (plan_type IN ('lifetime', 'monthly', 'yearly')),
    starts_at TIMESTAMPTZ DEFAULT NOW(),
    ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Couples can view own subscription" ON public.subscriptions;
CREATE POLICY "Couples can view own subscription" ON public.subscriptions
    FOR SELECT USING (
        couple_id IN (
            SELECT id FROM public.couples 
            WHERE partner1_id = auth.uid() OR partner2_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can manage subscriptions" ON public.subscriptions;
CREATE POLICY "Admins can manage subscriptions" ON public.subscriptions
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
    );

-- ============================================
-- 18. PAYMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    couple_id UUID REFERENCES public.couples(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'SAR',
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    provider TEXT DEFAULT 'manual',
    provider_transaction_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments" ON public.payments
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;
CREATE POLICY "Admins can view all payments" ON public.payments
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
    );

-- ============================================
-- 19. TIER LIMITS
-- ============================================

CREATE TABLE IF NOT EXISTS public.tier_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tier TEXT NOT NULL CHECK (tier IN ('free', 'premium')),
    feature TEXT NOT NULL,
    limit_value INT,
    period TEXT CHECK (period IN ('daily', 'weekly', 'monthly', 'forever')),
    description_ar TEXT,
    description_en TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tier, feature)
);

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tier_limits' AND column_name = 'period') THEN
        ALTER TABLE public.tier_limits ADD COLUMN period TEXT CHECK (period IN ('daily', 'weekly', 'monthly', 'forever'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tier_limits' AND column_name = 'description_ar') THEN
        ALTER TABLE public.tier_limits ADD COLUMN description_ar TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tier_limits' AND column_name = 'description_en') THEN
        ALTER TABLE public.tier_limits ADD COLUMN description_en TEXT;
    END IF;
END $$;

ALTER TABLE public.tier_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view tier limits" ON public.tier_limits;
CREATE POLICY "Anyone can view tier limits" ON public.tier_limits
    FOR SELECT USING (true);

-- Default tier limits (only required columns)
INSERT INTO public.tier_limits (tier, feature, limit_value) VALUES
('free', 'ai_chat', 5),
('free', 'conflict_ai', 2),
('free', 'game_sessions', 3),
('free', 'games_available', 4),
('free', 'journeys', 2),
('premium', 'ai_chat', NULL),
('premium', 'conflict_ai', NULL),
('premium', 'game_sessions', NULL),
('premium', 'games_available', NULL),
('premium', 'journeys', NULL)
ON CONFLICT (tier, feature) DO NOTHING;

-- ============================================
-- 20. USAGE TRACKING
-- ============================================

CREATE TABLE IF NOT EXISTS public.usage_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    feature TEXT NOT NULL,
    usage_count INT DEFAULT 0,
    period_type TEXT CHECK (period_type IN ('daily', 'weekly', 'monthly')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, feature, period_start)
);

ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own usage" ON public.usage_tracking;
CREATE POLICY "Users can manage own usage" ON public.usage_tracking
    FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Get user's subscription tier
CREATE OR REPLACE FUNCTION public.get_user_tier(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tier TEXT;
BEGIN
    SELECT 
        CASE 
            WHEN s.status = 'premium' AND (s.ends_at IS NULL OR s.ends_at > NOW()) 
            THEN 'premium'
            ELSE 'free'
        END INTO v_tier
    FROM public.subscriptions s
    JOIN public.couples c ON c.id = s.couple_id
    WHERE c.partner1_id = p_user_id OR c.partner2_id = p_user_id
    LIMIT 1;
    
    RETURN COALESCE(v_tier, 'free');
END;
$$;

-- Get partner info
DROP FUNCTION IF EXISTS public.get_partner(UUID);
CREATE OR REPLACE FUNCTION public.get_partner(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    display_name TEXT,
    avatar_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.display_name,
        p.avatar_url
    FROM public.profiles p
    JOIN public.couples c ON (
        (c.partner1_id = p_user_id AND c.partner2_id = p.id) OR
        (c.partner2_id = p_user_id AND c.partner1_id = p.id)
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_user_tier(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_partner(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_pairing_code() TO authenticated;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);
CREATE INDEX IF NOT EXISTS idx_couples_partner1 ON public.couples(partner1_id);
CREATE INDEX IF NOT EXISTS idx_couples_partner2 ON public.couples(partner2_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_user_id ON public.check_ins(user_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_created_at ON public.check_ins(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_couple_id ON public.messages(couple_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_game_sessions_couple_id ON public.game_sessions(couple_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_couple_id ON public.active_sessions(couple_id);

-- ============================================
-- ENABLE REALTIME
-- ============================================

-- Enable realtime for key tables
DO $$ 
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.game_sessions;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.active_sessions;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- DONE! Your Supabase is now configured for Wesal
-- ============================================
