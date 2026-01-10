-- ============================================
-- USER ACTION LOGS - Comprehensive Tracking System
-- Run this in Supabase SQL Editor
-- ============================================

-- Drop existing table if you need to reset (uncomment if needed)
-- DROP TABLE IF EXISTS public.user_action_logs CASCADE;

-- 1. Create the main logs table
CREATE TABLE IF NOT EXISTS public.user_action_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- User Context
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    couple_id UUID,
    session_id TEXT,                    -- Browser session identifier
    
    -- Action Details
    action_type TEXT NOT NULL CHECK (action_type IN (
        'page_view',      -- Navigation to a page
        'click',          -- Button/element click
        'api_request',    -- API call made
        'api_response',   -- API response received
        'error',          -- Error occurred
        'form_submit',    -- Form submission
        'auth',           -- Authentication events
        'subscription',   -- Subscription/premium events
        'game',           -- Game-related actions
        'admin'           -- Admin panel actions
    )),
    action_name TEXT NOT NULL,          -- Specific action: 'grant_premium', 'start_game', etc.
    
    -- Location Context
    page_path TEXT,                     -- '/admin/couples', '/play', etc.
    component TEXT,                     -- 'GrantPremiumButton', 'GameCard', etc.
    
    -- Request/Response Data
    request_data JSONB DEFAULT '{}',    -- Request payload (sanitized)
    response_data JSONB DEFAULT '{}',   -- Response data (sanitized)
    
    -- Error Information
    is_error BOOLEAN DEFAULT FALSE,
    error_code TEXT,                    -- 'UNAUTHORIZED', 'NOT_FOUND', etc.
    error_message TEXT,                 -- Human-readable error
    error_stack TEXT,                   -- Stack trace (dev only)
    
    -- Performance
    duration_ms INTEGER,                -- How long the action took
    
    -- Device & Network
    device_info JSONB DEFAULT '{}',     -- Browser, OS, screen size
    ip_address INET,
    user_agent TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',        -- Any additional context
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_user_action_logs_user_id ON public.user_action_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_action_logs_couple_id ON public.user_action_logs(couple_id);
CREATE INDEX IF NOT EXISTS idx_user_action_logs_session_id ON public.user_action_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_user_action_logs_action_type ON public.user_action_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_user_action_logs_action_name ON public.user_action_logs(action_name);
CREATE INDEX IF NOT EXISTS idx_user_action_logs_is_error ON public.user_action_logs(is_error) WHERE is_error = TRUE;
CREATE INDEX IF NOT EXISTS idx_user_action_logs_created_at ON public.user_action_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_action_logs_page_path ON public.user_action_logs(page_path);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_user_action_logs_type_date 
    ON public.user_action_logs(action_type, created_at DESC);

-- 3. Enable RLS
ALTER TABLE public.user_action_logs ENABLE ROW LEVEL SECURITY;

-- 4. Policies
-- Users can insert their own logs
DROP POLICY IF EXISTS "Users can insert own logs" ON public.user_action_logs;
CREATE POLICY "Users can insert own logs" ON public.user_action_logs
    FOR INSERT WITH CHECK (TRUE);  -- Allow all inserts (we validate in API)

-- Service role has full access
DROP POLICY IF EXISTS "Service role full access" ON public.user_action_logs;
CREATE POLICY "Service role full access" ON public.user_action_logs
    FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

-- Admins can view all logs
DROP POLICY IF EXISTS "Admins can view all logs" ON public.user_action_logs;
CREATE POLICY "Admins can view all logs" ON public.user_action_logs
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
    );

-- 5. Grant permissions
GRANT ALL ON public.user_action_logs TO service_role;
GRANT INSERT ON public.user_action_logs TO authenticated;
GRANT INSERT ON public.user_action_logs TO anon;

-- 6. Create helpful views for admin dashboard

-- Error summary view
CREATE OR REPLACE VIEW public.admin_error_summary AS
SELECT 
    DATE_TRUNC('hour', created_at) as hour,
    action_name,
    error_code,
    error_message,
    COUNT(*) as error_count
FROM public.user_action_logs
WHERE is_error = TRUE
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at), action_name, error_code, error_message
ORDER BY hour DESC, error_count DESC;

-- Action statistics view
CREATE OR REPLACE VIEW public.admin_action_stats AS
SELECT 
    action_type,
    action_name,
    COUNT(*) as total_count,
    COUNT(CASE WHEN is_error THEN 1 END) as error_count,
    ROUND(AVG(duration_ms)::numeric, 2) as avg_duration_ms,
    MAX(created_at) as last_occurrence
FROM public.user_action_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY action_type, action_name
ORDER BY total_count DESC;

-- Active sessions view
CREATE OR REPLACE VIEW public.admin_active_sessions AS
SELECT 
    session_id,
    user_id,
    COUNT(*) as action_count,
    MIN(created_at) as session_start,
    MAX(created_at) as last_action,
    ARRAY_AGG(DISTINCT page_path) as pages_visited
FROM public.user_action_logs
WHERE created_at > NOW() - INTERVAL '1 hour'
  AND session_id IS NOT NULL
GROUP BY session_id, user_id
ORDER BY last_action DESC;

-- 7. Cleanup function (run periodically to manage table size)
CREATE OR REPLACE FUNCTION public.cleanup_old_logs(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.user_action_logs
    WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.cleanup_old_logs(INTEGER) TO service_role;

-- Done!
SELECT 'User Action Logs table created successfully!' as status;
