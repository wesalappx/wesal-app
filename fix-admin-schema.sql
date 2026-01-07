-- ============================================
-- ADMIN DASHBOARD FIX - Run in Supabase SQL Editor
-- ============================================

-- 1. Create app_settings table (for games/journeys config from admin)
CREATE TABLE IF NOT EXISTS public.app_settings (
    key TEXT PRIMARY KEY,
    value JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Allow full access to app_settings (needed for both admin and public reads)
DROP POLICY IF EXISTS "Allow all access to app_settings" ON public.app_settings;
CREATE POLICY "Allow all access to app_settings" ON public.app_settings
    FOR ALL USING (true);

-- 2. Fix subscriptions table - add missing columns
DO $$ BEGIN
    ALTER TABLE public.subscriptions ADD COLUMN status TEXT DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'cancelled', 'expired', 'premium'));
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.subscriptions ADD COLUMN ends_at TIMESTAMPTZ;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.subscriptions ADD COLUMN plan_id TEXT DEFAULT 'premium_monthly';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.subscriptions ADD COLUMN started_at TIMESTAMPTZ DEFAULT NOW();
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 3. Create admin_audit_log table (for logging admin actions)
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_email TEXT,
    action TEXT NOT NULL,
    target_id TEXT,
    target_type TEXT,
    details JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to audit_log" ON public.admin_audit_log;
CREATE POLICY "Allow all access to audit_log" ON public.admin_audit_log
    FOR ALL USING (true);

-- 4. Fix profiles table for ban functionality
DO $$ BEGIN
    ALTER TABLE public.profiles ADD COLUMN is_banned BOOLEAN DEFAULT FALSE;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.profiles ADD COLUMN banned_at TIMESTAMPTZ;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 5. Create couple_streaks table (for streak reset functionality)
CREATE TABLE IF NOT EXISTS public.couple_streaks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE NOT NULL UNIQUE,
    current_streak INT DEFAULT 0,
    longest_streak INT DEFAULT 0,
    last_activity_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.couple_streaks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Couple members can view streaks" ON public.couple_streaks;
CREATE POLICY "Couple members can view streaks" ON public.couple_streaks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.couples
            WHERE id = couple_id
            AND (partner1_id = auth.uid() OR partner2_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Service role can manage streaks" ON public.couple_streaks;
CREATE POLICY "Service role can manage streaks" ON public.couple_streaks
    FOR ALL USING (true);

-- 6. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON public.app_settings(key);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON public.admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscriptions_couple_id ON public.subscriptions(couple_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- ============================================
-- DONE! Now:
-- 1. Deploy the code changes
-- 2. Go to /admin/games and click "Save Changes"
-- 3. Go to /admin/journeys and click "Save Changes"
-- 4. Test the subscription flow
-- ============================================
