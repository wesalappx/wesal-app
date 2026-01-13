-- =====================================================
-- User Action Logs Table
-- For real-time tracking of user actions in admin logs
-- =====================================================

-- Create the user_action_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_action_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    couple_id UUID,
    session_id TEXT,
    action_type TEXT NOT NULL,
    action_name TEXT NOT NULL,
    page_path TEXT,
    component TEXT,
    request_data JSONB DEFAULT '{}',
    response_data JSONB DEFAULT '{}',
    is_error BOOLEAN DEFAULT FALSE,
    error_code TEXT,
    error_message TEXT,
    error_stack TEXT,
    duration_ms INTEGER,
    device_info JSONB DEFAULT '{}',
    ip_address TEXT,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_action_logs_user_id ON user_action_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_action_logs_session_id ON user_action_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_action_logs_action_type ON user_action_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_action_logs_created_at ON user_action_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_action_logs_is_error ON user_action_logs(is_error) WHERE is_error = true;

-- Enable RLS
ALTER TABLE user_action_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then recreate
DROP POLICY IF EXISTS "Users can insert their own logs" ON user_action_logs;
DROP POLICY IF EXISTS "Service role can read all logs" ON user_action_logs;
DROP POLICY IF EXISTS "Anyone can insert logs" ON user_action_logs;

-- Policy: Allow anyone to insert logs (for tracking anonymous users too)
CREATE POLICY "Anyone can insert logs" ON user_action_logs
    FOR INSERT
    WITH CHECK (true);

-- Policy: Only service role can read logs (for admin dashboard)
CREATE POLICY "Service role can read all logs" ON user_action_logs
    FOR SELECT
    USING (auth.role() = 'service_role');

-- Auto-cleanup function: Delete logs older than 30 days
CREATE OR REPLACE FUNCTION cleanup_old_logs(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM user_action_logs
    WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE user_action_logs IS 'Tracks user actions for admin analytics dashboard';
