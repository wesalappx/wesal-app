-- ==========================================
-- SUBSCRIPTION TIERS & USAGE TRACKING SCHEMA
-- Run this in Supabase SQL Editor
-- ==========================================

-- 1. Tier Limits Configuration
-- Stores the limits for each feature per tier
CREATE TABLE IF NOT EXISTS public.tier_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tier TEXT NOT NULL CHECK (tier IN ('free', 'premium')),
    feature TEXT NOT NULL,
    limit_value INT,  -- NULL means unlimited
    period TEXT CHECK (period IN ('daily', 'weekly', 'monthly', 'forever')),
    description_ar TEXT,
    description_en TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tier, feature)
);

-- Enable RLS
ALTER TABLE public.tier_limits ENABLE ROW LEVEL SECURITY;

-- Everyone can read tier limits (public info)
DROP POLICY IF EXISTS "Anyone can view tier limits" ON public.tier_limits;
CREATE POLICY "Anyone can view tier limits" ON public.tier_limits
    FOR SELECT USING (true);

-- Only admins can modify
DROP POLICY IF EXISTS "Admins can manage tier limits" ON public.tier_limits;
CREATE POLICY "Admins can manage tier limits" ON public.tier_limits
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
    );

-- ==========================================
-- 2. Usage Tracking
-- Tracks feature usage per user for limit enforcement
-- ==========================================
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

-- Enable RLS
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage
DROP POLICY IF EXISTS "Users can view own usage" ON public.usage_tracking;
CREATE POLICY "Users can view own usage" ON public.usage_tracking
    FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own usage
DROP POLICY IF EXISTS "Users can update own usage" ON public.usage_tracking;
CREATE POLICY "Users can update own usage" ON public.usage_tracking
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can insert their own usage
DROP POLICY IF EXISTS "Users can insert own usage" ON public.usage_tracking;
CREATE POLICY "Users can insert own usage" ON public.usage_tracking
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can view all usage
DROP POLICY IF EXISTS "Admins can view all usage" ON public.usage_tracking;
CREATE POLICY "Admins can view all usage" ON public.usage_tracking
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
    );

-- ==========================================
-- 3. Insert Default Tier Limits
-- ==========================================

-- Clear existing limits and insert fresh
DELETE FROM public.tier_limits;

-- FREE TIER LIMITS
INSERT INTO public.tier_limits (tier, feature, limit_value, period, description_ar, description_en) VALUES
('free', 'ai_chat', 5, 'daily', '5 رسائل يومياً', '5 messages per day'),
('free', 'conflict_ai', 2, 'weekly', 'جلستين أسبوعياً', '2 sessions per week'),
('free', 'game_sessions', 3, 'daily', '3 جلسات يومياً', '3 sessions per day'),
('free', 'games_available', 4, 'forever', '4 ألعاب أساسية', '4 basic games'),
('free', 'journeys', 2, 'forever', 'رحلتين للبداية', '2 starter journeys'),
('free', 'whisper', 3, 'weekly', '3 همسات أسبوعياً', '3 whispers per week'),
('free', 'insights', 1, 'forever', 'إحصائيات أساسية', 'Basic insights only'),
('free', 'health_tracking', 1, 'forever', 'عرض فقط', 'View only');

-- PREMIUM TIER (NULL = unlimited)
INSERT INTO public.tier_limits (tier, feature, limit_value, period, description_ar, description_en) VALUES
('premium', 'ai_chat', NULL, NULL, 'غير محدود', 'Unlimited'),
('premium', 'conflict_ai', NULL, NULL, 'غير محدود', 'Unlimited'),
('premium', 'game_sessions', NULL, NULL, 'غير محدود', 'Unlimited'),
('premium', 'games_available', NULL, NULL, 'جميع الألعاب', 'All games'),
('premium', 'journeys', NULL, NULL, 'جميع الرحلات', 'All journeys'),
('premium', 'whisper', NULL, NULL, 'غير محدود', 'Unlimited'),
('premium', 'insights', NULL, NULL, 'تحليلات متقدمة', 'Advanced analytics'),
('premium', 'health_tracking', NULL, NULL, 'كامل + الخصوبة', 'Full + Fertility');

-- ==========================================
-- 4. Special Offers Table
-- For promotional discounts and promo codes
-- ==========================================
CREATE TABLE IF NOT EXISTS public.special_offers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    discount_percent INT NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ NOT NULL,
    code TEXT UNIQUE,
    is_active BOOLEAN DEFAULT true,
    max_uses INT,
    current_uses INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.special_offers ENABLE ROW LEVEL SECURITY;

-- Only admins can manage offers
DROP POLICY IF EXISTS "Admins can manage offers" ON public.special_offers;
CREATE POLICY "Admins can manage offers" ON public.special_offers
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
    );

-- Anyone can read active offers (for displaying on frontend)
DROP POLICY IF EXISTS "Anyone can view active offers" ON public.special_offers;
CREATE POLICY "Anyone can view active offers" ON public.special_offers
    FOR SELECT USING (is_active = true AND valid_until > NOW());

-- ==========================================
-- 4. Update Subscriptions Table
-- Add support for annual plans
-- ==========================================

-- Add plan_type column if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'subscriptions' AND column_name = 'plan_type') THEN
        ALTER TABLE public.subscriptions ADD COLUMN plan_type TEXT DEFAULT 'monthly' 
            CHECK (plan_type IN ('monthly', 'yearly', 'lifetime'));
    END IF;
END $$;

-- ==========================================
-- 5. Helper Functions
-- ==========================================

-- Function to get user's current tier
CREATE OR REPLACE FUNCTION public.get_user_tier(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tier TEXT;
BEGIN
    -- Check if user has active subscription
    SELECT 
        CASE 
            WHEN s.status = 'premium' AND (s.ends_at IS NULL OR s.ends_at > NOW()) 
            THEN 'premium'
            ELSE 'free'
        END INTO v_tier
    FROM public.subscriptions s
    JOIN public.pairings p ON p.couple_id = s.couple_id
    WHERE p.user1_id = p_user_id OR p.user2_id = p_user_id
    LIMIT 1;
    
    RETURN COALESCE(v_tier, 'free');
END;
$$;

-- Function to check if user can use a feature
CREATE OR REPLACE FUNCTION public.can_use_feature(p_user_id UUID, p_feature TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tier TEXT;
    v_limit INT;
    v_period TEXT;
    v_usage INT;
    v_period_start DATE;
    v_period_end DATE;
BEGIN
    -- Get user tier
    v_tier := public.get_user_tier(p_user_id);
    
    -- Get limit for this feature
    SELECT limit_value, period INTO v_limit, v_period
    FROM public.tier_limits
    WHERE tier = v_tier AND feature = p_feature;
    
    -- If no limit (NULL), user can use it
    IF v_limit IS NULL THEN
        RETURN jsonb_build_object(
            'can_use', true,
            'remaining', -1,
            'limit', -1,
            'resets_at', NULL,
            'tier', v_tier
        );
    END IF;
    
    -- Calculate period boundaries
    IF v_period = 'daily' THEN
        v_period_start := CURRENT_DATE;
        v_period_end := CURRENT_DATE;
    ELSIF v_period = 'weekly' THEN
        v_period_start := date_trunc('week', CURRENT_DATE)::DATE;
        v_period_end := (date_trunc('week', CURRENT_DATE) + INTERVAL '6 days')::DATE;
    ELSIF v_period = 'monthly' THEN
        v_period_start := date_trunc('month', CURRENT_DATE)::DATE;
        v_period_end := (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
    ELSE
        -- 'forever' limits are for feature access, not usage
        RETURN jsonb_build_object(
            'can_use', true,
            'remaining', v_limit,
            'limit', v_limit,
            'resets_at', NULL,
            'tier', v_tier
        );
    END IF;
    
    -- Get current usage
    SELECT COALESCE(usage_count, 0) INTO v_usage
    FROM public.usage_tracking
    WHERE user_id = p_user_id 
      AND feature = p_feature 
      AND period_start = v_period_start;
    
    RETURN jsonb_build_object(
        'can_use', v_usage < v_limit,
        'remaining', GREATEST(0, v_limit - v_usage),
        'limit', v_limit,
        'resets_at', v_period_end + INTERVAL '1 day',
        'tier', v_tier
    );
END;
$$;

-- Function to track usage
CREATE OR REPLACE FUNCTION public.track_feature_usage(p_user_id UUID, p_feature TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tier TEXT;
    v_limit INT;
    v_period TEXT;
    v_period_start DATE;
    v_period_end DATE;
    v_new_count INT;
BEGIN
    -- Get user tier
    v_tier := public.get_user_tier(p_user_id);
    
    -- Get limit for this feature
    SELECT limit_value, period INTO v_limit, v_period
    FROM public.tier_limits
    WHERE tier = v_tier AND feature = p_feature;
    
    -- If no limit (NULL), return success
    IF v_limit IS NULL THEN
        RETURN jsonb_build_object('success', true, 'remaining', -1);
    END IF;
    
    -- Calculate period boundaries
    IF v_period = 'daily' THEN
        v_period_start := CURRENT_DATE;
        v_period_end := CURRENT_DATE;
    ELSIF v_period = 'weekly' THEN
        v_period_start := date_trunc('week', CURRENT_DATE)::DATE;
        v_period_end := (date_trunc('week', CURRENT_DATE) + INTERVAL '6 days')::DATE;
    ELSIF v_period = 'monthly' THEN
        v_period_start := date_trunc('month', CURRENT_DATE)::DATE;
        v_period_end := (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
    ELSE
        RETURN jsonb_build_object('success', true, 'remaining', v_limit);
    END IF;
    
    -- Upsert usage tracking
    INSERT INTO public.usage_tracking (user_id, feature, usage_count, period_type, period_start, period_end)
    VALUES (p_user_id, p_feature, 1, v_period, v_period_start, v_period_end)
    ON CONFLICT (user_id, feature, period_start) 
    DO UPDATE SET 
        usage_count = usage_tracking.usage_count + 1,
        updated_at = NOW()
    RETURNING usage_count INTO v_new_count;
    
    RETURN jsonb_build_object(
        'success', v_new_count <= v_limit,
        'remaining', GREATEST(0, v_limit - v_new_count),
        'limit', v_limit
    );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_user_tier(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_use_feature(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.track_feature_usage(UUID, TEXT) TO authenticated;
