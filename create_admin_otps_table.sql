-- Create admin_otps table for storing OTP codes
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.admin_otps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    otp_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_otps_email ON public.admin_otps(email);

-- Enable RLS
ALTER TABLE public.admin_otps ENABLE ROW LEVEL SECURITY;

-- Only service role can access this table (no public access)
-- No policies needed since we use service role key

-- Auto-delete expired OTPs (optional - run periodically)
-- DELETE FROM public.admin_otps WHERE expires_at < NOW();

-- Grant access to service role
GRANT ALL ON public.admin_otps TO service_role;
