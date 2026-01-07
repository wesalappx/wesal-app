-- ============================================
-- FIX SUBSCRIPTIONS TABLE
-- Run this in Supabase SQL Editor
-- ============================================

-- Add all required columns if they don't exist
DO $$ BEGIN
    ALTER TABLE public.subscriptions ADD COLUMN plan_id TEXT DEFAULT 'premium_monthly';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.subscriptions ADD COLUMN started_at TIMESTAMPTZ DEFAULT NOW();
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.subscriptions ADD COLUMN ends_at TIMESTAMPTZ;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.subscriptions ADD COLUMN payment_id TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Add created_at if missing
DO $$ BEGIN
    ALTER TABLE public.subscriptions ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Add updated_at if missing
DO $$ BEGIN
    ALTER TABLE public.subscriptions ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- ============================================
-- FIX APP_SETTINGS TABLE (for admin configs)
-- ============================================
CREATE TABLE IF NOT EXISTS public.app_settings (
    key TEXT PRIMARY KEY,
    value JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Allow service role to access app_settings
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Policy for service role access
DROP POLICY IF EXISTS "Service role can manage app_settings" ON public.app_settings;
CREATE POLICY "Service role can manage app_settings" ON public.app_settings
    FOR ALL USING (true);

-- ============================================
-- FIX ADMIN_AUDIT_LOG TABLE
-- ============================================
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

DROP POLICY IF EXISTS "Admins can view audit log" ON public.admin_audit_log;
CREATE POLICY "Admins can view audit log" ON public.admin_audit_log
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role can insert audit log" ON public.admin_audit_log;
CREATE POLICY "Service role can insert audit log" ON public.admin_audit_log
    FOR INSERT WITH CHECK (true);

-- ============================================
-- FIX PROFILES TABLE (for ban functionality)
-- ============================================
DO $$ BEGIN
    ALTER TABLE public.profiles ADD COLUMN is_banned BOOLEAN DEFAULT FALSE;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.profiles ADD COLUMN banned_at TIMESTAMPTZ;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- ============================================
-- FIX COUPLE_STREAKS TABLE
-- ============================================
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

DROP POLICY IF EXISTS "Couple members can update streaks" ON public.couple_streaks;
CREATE POLICY "Couple members can update streaks" ON public.couple_streaks
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.couples
            WHERE id = couple_id
            AND (partner1_id = auth.uid() OR partner2_id = auth.uid())
        )
    );

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON public.app_settings(key);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON public.admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_couple_streaks_couple_id ON public.couple_streaks(couple_id);

-- ============================================
-- DONE! Tables should now be properly set up.
-- ============================================
