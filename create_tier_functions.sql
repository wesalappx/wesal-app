-- ============================================
-- Tier Limits Functions for Wesal App
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Function to get user's subscription tier
CREATE OR REPLACE FUNCTION get_user_tier(p_user_id UUID)
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
    FROM couples
    WHERE (partner1_id = p_user_id OR partner2_id = p_user_id)
      AND status = 'ACTIVE'
    LIMIT 1;

    IF v_couple_id IS NULL THEN
        RETURN 'free';
    END IF;

    -- Check for active subscription
    SELECT * INTO v_subscription
    FROM subscriptions
    WHERE couple_id = v_couple_id
      AND status = 'active'
      AND (ends_at IS NULL OR ends_at > NOW())
    LIMIT 1;

    IF v_subscription.id IS NOT NULL THEN
        RETURN 'premium';
    ELSE
        RETURN 'free';
    END IF;
END;
$$;

-- 2. Function to check if user can use a feature
CREATE OR REPLACE FUNCTION can_use_feature(p_user_id UUID, p_feature TEXT)
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
    v_tier := get_user_tier(p_user_id);

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
    FROM tier_limits
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
        ELSE v_period_start := '1970-01-01'::TIMESTAMPTZ; -- 'total' = forever
    END CASE;

    -- Count usage in this period
    SELECT COALESCE(COUNT(*), 0) INTO v_usage_count
    FROM feature_usage
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

-- 3. Function to track feature usage
CREATE OR REPLACE FUNCTION track_feature_usage(p_user_id UUID, p_feature TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_check JSONB;
BEGIN
    -- First check if user can use the feature
    v_check := can_use_feature(p_user_id, p_feature);

    IF NOT (v_check->>'can_use')::BOOLEAN THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'remaining', (v_check->>'remaining')::INTEGER,
            'error', 'Limit reached'
        );
    END IF;

    -- Record usage
    INSERT INTO feature_usage (user_id, feature, used_at)
    VALUES (p_user_id, p_feature, NOW());

    RETURN jsonb_build_object(
        'success', TRUE,
        'remaining', GREATEST(0, (v_check->>'remaining')::INTEGER - 1)
    );
END;
$$;

-- 4. Create feature_usage table if it doesn't exist
CREATE TABLE IF NOT EXISTS feature_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    feature TEXT NOT NULL,
    used_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feature_usage_user_feature ON feature_usage(user_id, feature, used_at);

-- 5. Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_tier(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION can_use_feature(UUID, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION track_feature_usage(UUID, TEXT) TO authenticated, anon;

-- 6. Enable RLS on feature_usage
ALTER TABLE feature_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage" ON feature_usage
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Service role full access to feature_usage" ON feature_usage
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

GRANT ALL ON feature_usage TO service_role;
GRANT SELECT, INSERT ON feature_usage TO authenticated;

-- Done!
SELECT 'Tier limit functions created successfully!' as message;
