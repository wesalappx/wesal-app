-- ============================================
-- FIX SUBSCRIPTIONS RLS POLICY
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable RLS on subscriptions if not already enabled
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Couples can view own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Service role full access to subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can view subscription for their couple" ON public.subscriptions;

-- Create policy: Users can view their couple's subscription
CREATE POLICY "Users can view subscription for their couple" ON public.subscriptions
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.couples c
            WHERE c.id = subscriptions.couple_id
            AND (c.partner1_id = auth.uid() OR c.partner2_id = auth.uid())
            AND c.status = 'ACTIVE'
        )
    );

-- Service role can do everything
CREATE POLICY "Service role full access to subscriptions" ON public.subscriptions
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.subscriptions TO service_role;
GRANT SELECT ON public.subscriptions TO authenticated;

-- Verify: Check if your subscription exists
SELECT 
    s.id,
    s.couple_id,
    s.status,
    s.plan_id,
    s.starts_at,
    s.ends_at
FROM public.subscriptions s
ORDER BY s.created_at DESC
LIMIT 5;
