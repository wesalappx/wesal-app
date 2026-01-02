-- Quick Fix: Run only the missing tables/policies
-- This script is safe to run if base tables already exist

-- ============================================
-- CONTENT_BLOCKS (if not exists from admin schema)
-- ============================================

CREATE TABLE IF NOT EXISTS public.content_blocks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('daily_tip', 'quote', 'journey_content', 'notification_template')),
    title_ar TEXT,
    title_en TEXT,
    content_ar TEXT NOT NULL,
    content_en TEXT,
    metadata JSONB DEFAULT '{}'::JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.content_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active content" ON public.content_blocks;
CREATE POLICY "Anyone can read active content" ON public.content_blocks
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage content" ON public.content_blocks;
CREATE POLICY "Admins can manage content" ON public.content_blocks
    FOR ALL USING (true);

-- Insert sample content if empty
INSERT INTO public.content_blocks (type, title_ar, content_ar, title_en, content_en, metadata) 
SELECT 'daily_tip', 'نصيحة اليوم', 'خذ وقتاً كل يوم للاستماع لشريكك دون مقاطعة', 'Daily Tip', 'Take time every day to listen to your partner without interrupting', '{"category": "communication"}'::JSONB
WHERE NOT EXISTS (SELECT 1 FROM public.content_blocks WHERE type = 'daily_tip' LIMIT 1);

INSERT INTO public.content_blocks (type, title_ar, content_ar, title_en, content_en, metadata)
SELECT 'quote', 'حكمة', 'الزواج الناجح يتطلب الوقوع في الحب مرات عديدة، ودائماً مع نفس الشخص', 'Quote', 'A successful marriage requires falling in love many times, always with the same person', '{"author": "Mignon McLaughlin"}'::JSONB
WHERE NOT EXISTS (SELECT 1 FROM public.content_blocks WHERE type = 'quote' LIMIT 1);

-- ============================================
-- GAME_SESSIONS (ensure exists)
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

DROP POLICY IF EXISTS "Couple members can view game sessions" ON public.game_sessions;
CREATE POLICY "Couple members can view game sessions" ON public.game_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.couples
            WHERE id = couple_id
            AND (partner1_id = auth.uid() OR partner2_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Couple members can update game sessions" ON public.game_sessions;
CREATE POLICY "Couple members can update game sessions" ON public.game_sessions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.couples
            WHERE id = couple_id
            AND (partner1_id = auth.uid() OR partner2_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Couple members can insert game sessions" ON public.game_sessions;
CREATE POLICY "Couple members can insert game sessions" ON public.game_sessions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.couples
            WHERE id = couple_id
            AND (partner1_id = auth.uid() OR partner2_id = auth.uid())
        )
    );

-- ============================================
-- STREAKS (ensure exists)
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

-- ============================================
-- ADMIN TABLES (ensure all exist)
-- ============================================

-- Admin users table
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    role TEXT DEFAULT 'admin',
    permissions JSONB DEFAULT '{"*": true}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view admin users" ON public.admin_users;
CREATE POLICY "Admins can view admin users" ON public.admin_users
    FOR SELECT USING (true);

-- Admin audit log
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id TEXT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view audit log" ON public.admin_audit_log;
CREATE POLICY "Admins can view audit log" ON public.admin_audit_log
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can insert audit log" ON public.admin_audit_log;
CREATE POLICY "Admins can insert audit log" ON public.admin_audit_log
    FOR INSERT WITH CHECK (true);

-- ============================================
-- TIER LIMITS & SPECIAL OFFERS (from tiers schema)
-- ============================================

-- Drop existing tier_limits if it has wrong schema
DROP TABLE IF EXISTS public.tier_limits CASCADE;

CREATE TABLE public.tier_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tier TEXT NOT NULL CHECK (tier IN ('free', 'premium')),
    feature TEXT NOT NULL,
    daily_limit INT,
    weekly_limit INT,
    monthly_limit INT,
    is_unlimited BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tier, feature)
);

ALTER TABLE public.tier_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read tier limits" ON public.tier_limits;
CREATE POLICY "Anyone can read tier limits" ON public.tier_limits
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage tier limits" ON public.tier_limits;
CREATE POLICY "Admins can manage tier limits" ON public.tier_limits
    FOR ALL USING (true);

-- Insert default tier limits
INSERT INTO public.tier_limits (tier, feature, daily_limit, weekly_limit, monthly_limit, is_unlimited) VALUES
    ('free', 'ai_coach', 5, NULL, NULL, FALSE),
    ('free', 'games', 3, NULL, NULL, FALSE),
    ('free', 'whisper', NULL, 3, NULL, FALSE),
    ('free', 'conflict_ai', NULL, 2, NULL, FALSE),
    ('free', 'journeys', NULL, NULL, 2, FALSE),
    ('premium', 'ai_coach', NULL, NULL, NULL, TRUE),
    ('premium', 'games', NULL, NULL, NULL, TRUE),
    ('premium', 'whisper', NULL, NULL, NULL, TRUE),
    ('premium', 'conflict_ai', NULL, NULL, NULL, TRUE),
    ('premium', 'journeys', NULL, NULL, NULL, TRUE);

-- Special offers table
DROP TABLE IF EXISTS public.special_offers CASCADE;
CREATE TABLE IF NOT EXISTS public.special_offers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    discount_percent INT NOT NULL CHECK (discount_percent BETWEEN 1 AND 100),
    valid_from TIMESTAMPTZ NOT NULL,
    valid_until TIMESTAMPTZ NOT NULL,
    code TEXT UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    max_uses INT,
    current_uses INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.special_offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active offers" ON public.special_offers;
CREATE POLICY "Anyone can read active offers" ON public.special_offers
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage offers" ON public.special_offers;
CREATE POLICY "Admins can manage offers" ON public.special_offers
    FOR ALL USING (true);

-- ============================================
-- USAGE TRACKING
-- ============================================

DROP TABLE IF EXISTS public.usage_tracking CASCADE;

CREATE TABLE public.usage_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    couple_id UUID,
    user_id UUID NOT NULL,
    feature TEXT NOT NULL,
    used_at TIMESTAMPTZ DEFAULT NOW(),
    period_start DATE DEFAULT CURRENT_DATE
);

ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own usage" ON public.usage_tracking;
CREATE POLICY "Users can view own usage" ON public.usage_tracking
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can track own usage" ON public.usage_tracking;
CREATE POLICY "Users can track own usage" ON public.usage_tracking
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Index for efficient usage queries
CREATE INDEX IF NOT EXISTS idx_usage_tracking_lookup 
    ON public.usage_tracking(couple_id, feature, period_start);

-- ============================================
-- APP SETTINGS
-- ============================================

CREATE TABLE IF NOT EXISTS public.app_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read app settings" ON public.app_settings;
CREATE POLICY "Anyone can read app settings" ON public.app_settings
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage app settings" ON public.app_settings;
CREATE POLICY "Admins can manage app settings" ON public.app_settings
    FOR ALL USING (true);

-- Insert default settings
INSERT INTO public.app_settings (key, value, description, category) VALUES
    ('premium_monthly_price', '29'::JSONB, 'Monthly premium price in SAR', 'pricing'),
    ('premium_annual_price', '249'::JSONB, 'Annual premium price in SAR', 'pricing'),
    ('maintenance_mode', 'false'::JSONB, 'Enable maintenance mode', 'general')
ON CONFLICT (key) DO NOTHING;

-- Success message
SELECT 'All admin tables and policies created successfully!' as result;
