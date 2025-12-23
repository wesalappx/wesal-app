-- Admin Dashboard Schema for Wesal (وصال) Couples App
-- Run this in Supabase SQL Editor
-- Safe to run multiple times (idempotent)

-- ============================================
-- ADMIN USERS (Role Management)
-- ============================================

CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
    role TEXT DEFAULT 'moderator' CHECK (role IN ('super_admin', 'admin', 'moderator', 'viewer')),
    permissions JSONB DEFAULT '{"users": true, "couples": true, "content": false, "settings": false}'::JSONB,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Only admins can view admin users
DROP POLICY IF EXISTS "Admins can view admin users" ON public.admin_users;
CREATE POLICY "Admins can view admin users" ON public.admin_users
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
    );

-- Only super_admins can manage admin users
DROP POLICY IF EXISTS "Super admins can manage admin users" ON public.admin_users;
CREATE POLICY "Super admins can manage admin users" ON public.admin_users
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid() AND role = 'super_admin')
    );

-- ============================================
-- ADMIN AUDIT LOG (Track Actions)
-- ============================================

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
    action TEXT NOT NULL, -- 'create', 'update', 'delete', 'view'
    entity_type TEXT NOT NULL, -- 'user', 'couple', 'content', 'settings'
    entity_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view audit log" ON public.admin_audit_log;
CREATE POLICY "Admins can view audit log" ON public.admin_audit_log
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Admins can insert audit log" ON public.admin_audit_log;
CREATE POLICY "Admins can insert audit log" ON public.admin_audit_log
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
    );

-- ============================================
-- APP SETTINGS (Global Configuration)
-- ============================================

CREATE TABLE IF NOT EXISTS public.app_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general', -- 'general', 'notifications', 'features', 'limits'
    updated_by UUID REFERENCES public.profiles(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read app settings (for feature flags)
DROP POLICY IF EXISTS "Anyone can read app settings" ON public.app_settings;
CREATE POLICY "Anyone can read app settings" ON public.app_settings
    FOR SELECT USING (true);

-- Only admins can update settings
DROP POLICY IF EXISTS "Admins can manage app settings" ON public.app_settings;
CREATE POLICY "Admins can manage app settings" ON public.app_settings
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin'))
    );

-- Insert default settings
INSERT INTO public.app_settings (key, value, description, category) VALUES
    ('maintenance_mode', 'false'::JSONB, 'Enable/disable maintenance mode', 'general'),
    ('max_pairing_codes_per_user', '3'::JSONB, 'Maximum pairing codes a user can generate', 'limits'),
    ('daily_checkin_reminder', 'true'::JSONB, 'Send daily check-in reminders', 'notifications'),
    ('streak_milestone_notification', 'true'::JSONB, 'Notify on streak milestones', 'notifications')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- CONTENT BLOCKS (Manageable Content)
-- ============================================

CREATE TABLE IF NOT EXISTS public.content_blocks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('daily_tip', 'quote', 'journey_content', 'notification_template')),
    title_ar TEXT,
    title_en TEXT,
    content_ar TEXT NOT NULL,
    content_en TEXT,
    metadata JSONB DEFAULT '{}'::JSONB, -- For category, tags, etc.
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.content_blocks ENABLE ROW LEVEL SECURITY;

-- Anyone can read active content
DROP POLICY IF EXISTS "Anyone can read active content" ON public.content_blocks;
CREATE POLICY "Anyone can read active content" ON public.content_blocks
    FOR SELECT USING (is_active = true);

-- Admins can manage all content
DROP POLICY IF EXISTS "Admins can manage content" ON public.content_blocks;
CREATE POLICY "Admins can manage content" ON public.content_blocks
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
    );

-- Insert sample content
INSERT INTO public.content_blocks (type, title_ar, content_ar, title_en, content_en, metadata) VALUES
    ('daily_tip', 'نصيحة اليوم', 'خذ وقتاً كل يوم للاستماع لشريكك دون مقاطعة', 'Daily Tip', 'Take time every day to listen to your partner without interrupting', '{"category": "communication"}'::JSONB),
    ('quote', 'حكمة', 'الزواج الناجح يتطلب الوقوع في الحب مرات عديدة، ودائماً مع نفس الشخص', 'Quote', 'A successful marriage requires falling in love many times, always with the same person', '{"author": "Mignon McLaughlin"}'::JSONB)
ON CONFLICT DO NOTHING;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_users 
        WHERE user_id = check_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get admin role
CREATE OR REPLACE FUNCTION public.get_admin_role(check_user_id UUID DEFAULT auth.uid())
RETURNS TEXT AS $$
DECLARE
    admin_role TEXT;
BEGIN
    SELECT role INTO admin_role 
    FROM public.admin_users 
    WHERE user_id = check_user_id;
    
    RETURN admin_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VIEWS FOR ADMIN STATISTICS
-- ============================================

-- User Statistics View
CREATE OR REPLACE VIEW public.admin_user_stats AS
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as new_today,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as new_this_week,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) as new_this_month
FROM public.profiles;

-- Couple Statistics View
CREATE OR REPLACE VIEW public.admin_couple_stats AS
SELECT 
    COUNT(*) as total_couples,
    COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active_couples,
    COUNT(CASE WHEN paired_at > NOW() - INTERVAL '24 hours' THEN 1 END) as paired_today,
    COUNT(CASE WHEN paired_at > NOW() - INTERVAL '7 days' THEN 1 END) as paired_this_week
FROM public.couples;

-- Check-in Statistics View
CREATE OR REPLACE VIEW public.admin_checkin_stats AS
SELECT 
    COUNT(*) as total_checkins,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as checkins_today,
    ROUND(AVG(mood)::numeric, 2) as avg_mood,
    ROUND(AVG(energy)::numeric, 2) as avg_energy,
    ROUND(AVG(stress)::numeric, 2) as avg_stress
FROM public.check_ins;

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON public.admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_id ON public.admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON public.admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_blocks_type ON public.content_blocks(type);
CREATE INDEX IF NOT EXISTS idx_content_blocks_active ON public.content_blocks(is_active) WHERE is_active = true;
