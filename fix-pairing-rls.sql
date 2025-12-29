-- Fix pairing_codes RLS policies
-- The issue: Only code creators could see codes, preventing others from accepting them

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can view own codes" ON public.pairing_codes;

-- Create new policy: Anyone can READ valid unused codes (needed to accept them)
CREATE POLICY "Anyone can read valid codes" ON public.pairing_codes
    FOR SELECT USING (
        -- Creator can always see their codes
        auth.uid() = created_by
        OR 
        -- Others can see unused, non-expired codes (to accept them)
        (used_at IS NULL AND expires_at > NOW())
    );

-- Keep the insert policy (only authenticated users can create codes for themselves)
-- This should already exist, but recreate to be safe
DROP POLICY IF EXISTS "Users can create codes" ON public.pairing_codes;
CREATE POLICY "Users can create codes" ON public.pairing_codes
    FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Keep the update policy (anyone can update valid codes to mark as used)
DROP POLICY IF EXISTS "Anyone can use valid codes" ON public.pairing_codes;
CREATE POLICY "Anyone can use valid codes" ON public.pairing_codes
    FOR UPDATE USING (
        used_at IS NULL AND expires_at > NOW()
    );

-- Allow users to delete their own codes
DROP POLICY IF EXISTS "Users can delete own codes" ON public.pairing_codes;
CREATE POLICY "Users can delete own codes" ON public.pairing_codes
    FOR DELETE USING (auth.uid() = created_by);
