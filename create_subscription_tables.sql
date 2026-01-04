-- ============================================
-- Admin Subscription Management Tables
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. Create app_settings table for dynamic pricing
CREATE TABLE IF NOT EXISTS public.app_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value JSONB,
    updated_by UUID,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Allow service_role full access (for API routes)
CREATE POLICY "Service role has full access to app_settings" ON public.app_settings
    FOR ALL 
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Allow authenticated users to read settings (for fetching prices in app)
CREATE POLICY "Authenticated users can read app_settings" ON public.app_settings
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow anon to read settings (for public pricing page)
CREATE POLICY "Anon can read app_settings" ON public.app_settings
    FOR SELECT
    TO anon
    USING (true);

-- Grant permissions
GRANT ALL ON public.app_settings TO service_role;
GRANT SELECT ON public.app_settings TO anon, authenticated;

-- 2. Insert default pricing values (won't overwrite if already exist)
INSERT INTO public.app_settings (key, value) VALUES
    ('premium_monthly_price', '29'),
    ('premium_annual_price', '249'),
    ('annual_discount_months', '2')
ON CONFLICT (key) DO NOTHING;

-- 3. Create tier_limits table for feature limits
CREATE TABLE IF NOT EXISTS public.tier_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tier TEXT NOT NULL CHECK (tier IN ('free', 'premium')),
    feature TEXT NOT NULL,
    limit_value INTEGER,
    period TEXT, -- 'day', 'week', 'month', 'total'
    description_ar TEXT,
    description_en TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tier, feature)
);

-- Enable RLS
ALTER TABLE public.tier_limits ENABLE ROW LEVEL SECURITY;

-- Policies for tier_limits
CREATE POLICY "Service role has full access to tier_limits" ON public.tier_limits
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Everyone can read tier_limits" ON public.tier_limits
    FOR SELECT TO anon, authenticated USING (true);

GRANT ALL ON public.tier_limits TO service_role;
GRANT SELECT ON public.tier_limits TO anon, authenticated;

-- Insert default free tier limits
INSERT INTO public.tier_limits (tier, feature, limit_value, period, description_ar, description_en) VALUES
    ('free', 'ai_chat', 5, 'day', '5 رسائل يومياً', '5 messages per day'),
    ('free', 'conflict_ai', 2, 'week', 'جلستين أسبوعياً', '2 sessions per week'),
    ('free', 'game_sessions', 3, 'day', '3 جلسات يومياً', '3 sessions per day'),
    ('free', 'games_available', 4, 'total', '4 ألعاب أساسية', '4 basic games'),
    ('free', 'journeys', 1, 'total', 'رحلة واحدة', '1 journey'),
    ('free', 'whisper', 1, 'day', 'همسة واحدة يومياً', '1 whisper per day')
ON CONFLICT (tier, feature) DO NOTHING;

-- 4. Create special_offers table for promotional discounts
CREATE TABLE IF NOT EXISTS public.special_offers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    discount_percent INTEGER NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
    valid_from TIMESTAMPTZ NOT NULL,
    valid_until TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT true,
    code TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.special_offers ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Service role has full access to special_offers" ON public.special_offers
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Everyone can read active special_offers" ON public.special_offers
    FOR SELECT TO anon, authenticated
    USING (is_active = true AND valid_until > NOW());

GRANT ALL ON public.special_offers TO service_role;
GRANT SELECT ON public.special_offers TO anon, authenticated;

-- Success message
SELECT 'All subscription tables created successfully!' as message;
