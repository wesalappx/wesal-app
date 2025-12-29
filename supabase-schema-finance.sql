-- MASTER ADMIN & FINANCE SCHEMA
-- Run this in Supabase SQL Editor to fix all Admin Dashboard errors

-- ==========================================
-- 1. ADMIN USERS & SECURITY
-- ==========================================

CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'moderator', 'viewer')),
    permissions JSONB DEFAULT '{"users": true, "couples": true, "content": true, "settings": false}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Safely recreate policies
DROP POLICY IF EXISTS "Super admins can manage admin_users" ON public.admin_users;
CREATE POLICY "Super admins can manage admin_users" ON public.admin_users
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid() AND au.role = 'super_admin')
    );

DROP POLICY IF EXISTS "Admins can view own profile" ON public.admin_users;
CREATE POLICY "Admins can view own profile" ON public.admin_users
    FOR SELECT USING (user_id = auth.uid());

-- ==========================================
-- 2. APP SETTINGS (Dynamic Pricing, etc.)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.app_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general',
    updated_by UUID REFERENCES auth.users(id), -- admin user id
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view settings" ON public.app_settings;
CREATE POLICY "Admins can view settings" ON public.app_settings
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Admins can update settings" ON public.app_settings;
CREATE POLICY "Admins can update settings" ON public.app_settings
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
    );

-- Default Pricing Setting
INSERT INTO public.app_settings (key, value, description, category) 
VALUES (
    'premium_price', 
    '50'::JSONB, 
    'One-time payment cost for Premium access (SAR)', 
    'finance'
) ON CONFLICT (key) DO NOTHING;

-- ==========================================
-- 3. AUDIT LOGS
-- ==========================================

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID REFERENCES public.admin_users(id),
    action TEXT NOT NULL, -- 'update', 'delete', 'create'
    entity_type TEXT NOT NULL, -- 'settings', 'user', 'couple'
    entity_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view logs" ON public.admin_audit_log;
CREATE POLICY "Admins can view logs" ON public.admin_audit_log
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
    );

-- ==========================================
-- 4. SUBSCRIPTIONS (Couple-based Access)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE NOT NULL UNIQUE,
    status TEXT DEFAULT 'trial' CHECK (status IN ('trial', 'premium', 'expired')),
    plan_type TEXT DEFAULT 'lifetime' CHECK (plan_type IN ('lifetime', 'monthly', 'yearly')),
    starts_at TIMESTAMPTZ DEFAULT NOW(),
    ends_at TIMESTAMPTZ, -- NULL for lifetime
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Everyone can read their own couple's subscription
DROP POLICY IF EXISTS "Couples can view own subscription" ON public.subscriptions;
CREATE POLICY "Couples can view own subscription" ON public.subscriptions
    FOR SELECT USING (
        couple_id IN (
            SELECT id FROM public.couples 
            WHERE partner1_id = auth.uid() OR partner2_id = auth.uid()
        )
    );

-- Admins can view all subscriptions
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.subscriptions;
CREATE POLICY "Admins can view all subscriptions" ON public.subscriptions
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
    );

-- Admins can manage subscriptions
DROP POLICY IF EXISTS "Admins can manage subscriptions" ON public.subscriptions;
CREATE POLICY "Admins can manage subscriptions" ON public.subscriptions
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
    );

-- ==========================================
-- 5. PAYMENTS (Transaction History)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    couple_id UUID REFERENCES public.couples(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Who paid
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'SAR',
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    provider TEXT DEFAULT 'manual', -- 'stripe', 'apple', 'manual'
    provider_transaction_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Users can view their own payments
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments" ON public.payments
    FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all payments
DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;
CREATE POLICY "Admins can view all payments" ON public.payments
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
    );

-- ==========================================
-- 6. ANALYTICS VIEW
-- ==========================================

CREATE OR REPLACE VIEW public.admin_finance_stats AS
SELECT 
    (SELECT COALESCE(SUM(amount), 0) FROM public.payments WHERE status = 'completed') as total_revenue,
    (SELECT COUNT(*) FROM public.payments WHERE status = 'completed' AND created_at > NOW() - INTERVAL '30 days') as transactions_last_30d,
    (SELECT COUNT(*) FROM public.subscriptions WHERE status = 'premium') as total_premium_couples,
    (SELECT COUNT(*) FROM public.subscriptions WHERE status = 'trial') as active_trials;


