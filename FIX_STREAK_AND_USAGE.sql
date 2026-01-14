-- ============================================
-- COMPLETE DATABASE FIX - Streak + Usage Tracking
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- PART 1: FIX STREAKS TABLE
-- ============================================

-- Create streaks table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.streaks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE UNIQUE,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_date DATE,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Couples can view own streaks" ON public.streaks;
DROP POLICY IF EXISTS "Couples can update own streaks" ON public.streaks;
DROP POLICY IF EXISTS "Couples can insert own streaks" ON public.streaks;
DROP POLICY IF EXISTS "Service role full access to streaks" ON public.streaks;

-- Create policies
CREATE POLICY "Couples can view own streaks" ON public.streaks
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.couples c
            WHERE c.id = streaks.couple_id
            AND (c.partner1_id = auth.uid() OR c.partner2_id = auth.uid())
        )
    );

CREATE POLICY "Couples can update own streaks" ON public.streaks
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.couples c
            WHERE c.id = streaks.couple_id
            AND (c.partner1_id = auth.uid() OR c.partner2_id = auth.uid())
        )
    );

CREATE POLICY "Couples can insert own streaks" ON public.streaks
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.couples c
            WHERE c.id = streaks.couple_id
            AND (c.partner1_id = auth.uid() OR c.partner2_id = auth.uid())
        )
    );

CREATE POLICY "Service role full access to streaks" ON public.streaks
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.streaks TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.streaks TO authenticated;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_streaks_couple_id ON public.streaks(couple_id);

-- ============================================
-- PART 2: FIX TIER LIMITS TABLE
-- ============================================

-- Create tier_limits table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.tier_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tier TEXT NOT NULL CHECK (tier IN ('free', 'premium')),
    feature TEXT NOT NULL,
    limit_value INTEGER NOT NULL,
    period TEXT NOT NULL CHECK (period IN ('day', 'week', 'month', 'total')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tier, feature)
);

-- Insert default limits for free tier
INSERT INTO public.tier_limits (tier, feature, limit_value, period) VALUES
    ('free', 'ai_chat', 5, 'day'),
    ('free', 'conflict_ai', 2, 'week'),
    ('free', 'whisper', 3, 'week'),
    ('free', 'game_sessions', 5, 'day'),
    ('free', 'insights', 1, 'day')
ON CONFLICT (tier, feature) DO UPDATE SET
    limit_value = EXCLUDED.limit_value,
    period = EXCLUDED.period;

-- ============================================
-- PART 3: FIX FEATURE USAGE TABLE
-- ============================================

-- Create feature_usage table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.feature_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    feature TEXT NOT NULL,
    used_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.feature_usage ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own usage" ON public.feature_usage;
DROP POLICY IF EXISTS "Users can insert own usage" ON public.feature_usage;
DROP POLICY IF EXISTS "Service role full access to feature_usage" ON public.feature_usage;

-- Create policies
CREATE POLICY "Users can view own usage" ON public.feature_usage
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert own usage" ON public.feature_usage
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role full access to feature_usage" ON public.feature_usage
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.feature_usage TO service_role;
GRANT SELECT, INSERT ON public.feature_usage TO authenticated;

-- Create index for faster counting
CREATE INDEX IF NOT EXISTS idx_feature_usage_user_feature ON public.feature_usage(user_id, feature, used_at);

-- ============================================
-- PART 4: FIX GET_USER_TIER FUNCTION
-- (Checks for BOTH 'active' AND 'premium' status)
-- ============================================

CREATE OR REPLACE FUNCTION public.get_user_tier(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_couple_id UUID;
    v_subscription RECORD;
BEGIN
    -- Get the user's couple_id
    SELECT id INTO v_couple_id
    FROM public.couples
    WHERE (partner1_id = p_user_id OR partner2_id = p_user_id)
      AND status = 'ACTIVE'
    LIMIT 1;

    IF v_couple_id IS NULL THEN
        RETURN 'free';
    END IF;

    -- Check for active subscription (status can be 'active' OR 'premium')
    SELECT * INTO v_subscription
    FROM public.subscriptions
    WHERE couple_id = v_couple_id
      AND status IN ('active', 'premium')  -- FIX: Check both statuses
      AND (ends_at IS NULL OR ends_at > NOW())
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_subscription.id IS NOT NULL THEN
        RETURN 'premium';
    ELSE
        RETURN 'free';
    END IF;
END;
$$;

-- ============================================
-- PART 5: FIX CAN_USE_FEATURE FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION public.can_use_feature(p_user_id UUID, p_feature TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tier TEXT;
    v_limit_record RECORD;
    v_usage_count INTEGER;
    v_period_start TIMESTAMPTZ;
    v_can_use BOOLEAN;
    v_remaining INTEGER;
BEGIN
    -- Get user's tier
    v_tier := public.get_user_tier(p_user_id);

    -- Premium users have unlimited access
    IF v_tier = 'premium' THEN
        RETURN jsonb_build_object(
            'can_use', TRUE,
            'remaining', -1,
            'limit', -1,
            'tier', 'premium',
            'resets_at', NULL
        );
    END IF;

    -- Get the limit for this feature and tier
    SELECT * INTO v_limit_record
    FROM public.tier_limits
    WHERE tier = v_tier AND feature = p_feature;

    -- If no limit defined, allow unlimited
    IF v_limit_record IS NULL THEN
        RETURN jsonb_build_object(
            'can_use', TRUE,
            'remaining', -1,
            'limit', -1,
            'tier', v_tier,
            'resets_at', NULL
        );
    END IF;

    -- Calculate period start based on limit period
    CASE v_limit_record.period
        WHEN 'day' THEN v_period_start := DATE_TRUNC('day', NOW());
        WHEN 'week' THEN v_period_start := DATE_TRUNC('week', NOW());
        WHEN 'month' THEN v_period_start := DATE_TRUNC('month', NOW());
        ELSE v_period_start := '1970-01-01'::TIMESTAMPTZ;
    END CASE;

    -- Count usage in this period
    SELECT COALESCE(COUNT(*), 0) INTO v_usage_count
    FROM public.feature_usage
    WHERE user_id = p_user_id
      AND feature = p_feature
      AND used_at >= v_period_start;

    v_can_use := v_usage_count < COALESCE(v_limit_record.limit_value, 0);
    v_remaining := GREATEST(0, COALESCE(v_limit_record.limit_value, 0) - v_usage_count);

    RETURN jsonb_build_object(
        'can_use', v_can_use,
        'remaining', v_remaining,
        'limit', v_limit_record.limit_value,
        'tier', v_tier,
        'resets_at', CASE v_limit_record.period
            WHEN 'day' THEN DATE_TRUNC('day', NOW()) + INTERVAL '1 day'
            WHEN 'week' THEN DATE_TRUNC('week', NOW()) + INTERVAL '1 week'
            WHEN 'month' THEN DATE_TRUNC('month', NOW()) + INTERVAL '1 month'
            ELSE NULL
        END
    );
END;
$$;

-- ============================================
-- PART 6: FIX TRACK_FEATURE_USAGE FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION public.track_feature_usage(p_user_id UUID, p_feature TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_check JSONB;
BEGIN
    -- First check if user can use the feature
    v_check := public.can_use_feature(p_user_id, p_feature);

    IF NOT (v_check->>'can_use')::BOOLEAN THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'remaining', (v_check->>'remaining')::INTEGER,
            'error', 'Limit reached'
        );
    END IF;

    -- Record usage
    INSERT INTO public.feature_usage (user_id, feature, used_at)
    VALUES (p_user_id, p_feature, NOW());

    RETURN jsonb_build_object(
        'success', TRUE,
        'remaining', GREATEST(0, (v_check->>'remaining')::INTEGER - 1)
    );
END;
$$;

-- ============================================
-- PART 7: GRANT EXECUTE PERMISSIONS
-- ============================================

GRANT EXECUTE ON FUNCTION public.get_user_tier(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.can_use_feature(UUID, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.track_feature_usage(UUID, TEXT) TO authenticated, anon;

-- ============================================
-- PART 8: INITIALIZE STREAKS FOR EXISTING COUPLES
-- ============================================

-- Create streak rows for couples that don't have one
INSERT INTO public.streaks (couple_id, current_streak, longest_streak)
SELECT c.id, 0, 0
FROM public.couples c
WHERE c.status = 'ACTIVE'
  AND NOT EXISTS (SELECT 1 FROM public.streaks s WHERE s.couple_id = c.id)
ON CONFLICT (couple_id) DO NOTHING;

-- ============================================
-- DONE!
-- ============================================
SELECT 'Database fixes applied successfully!' as message;
