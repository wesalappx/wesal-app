-- ============================================
-- Fix: Add missing columns to existing tables
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. Fix tier_limits table - add missing column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tier_limits' AND column_name = 'limit_value') THEN
        ALTER TABLE public.tier_limits ADD COLUMN limit_value INTEGER;
    END IF;
END $$;

-- 2. Ensure app_settings table exists with proper structure
CREATE TABLE IF NOT EXISTS public.app_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value JSONB,
    updated_by UUID,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS on app_settings
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies if they exist, then recreate
DROP POLICY IF EXISTS "Service role has full access to app_settings" ON public.app_settings;
DROP POLICY IF EXISTS "Authenticated users can read app_settings" ON public.app_settings;
DROP POLICY IF EXISTS "Anon can read app_settings" ON public.app_settings;

-- Create policies
CREATE POLICY "Service role has full access to app_settings" ON public.app_settings
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read app_settings" ON public.app_settings
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Anon can read app_settings" ON public.app_settings
    FOR SELECT TO anon USING (true);

-- 5. Grant permissions
GRANT ALL ON public.app_settings TO service_role;
GRANT SELECT ON public.app_settings TO anon, authenticated;

-- 6. Insert default pricing (won't overwrite existing)
INSERT INTO public.app_settings (key, value) VALUES
    ('premium_monthly_price', '29'),
    ('premium_annual_price', '249'),
    ('annual_discount_months', '2')
ON CONFLICT (key) DO NOTHING;

-- Done!
SELECT 'Tables fixed successfully!' as message;
