-- Create signup_otps table for storing signup verification codes
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.signup_otps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    otp_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_signup_otps_email ON public.signup_otps(email);

-- Enable RLS
ALTER TABLE public.signup_otps ENABLE ROW LEVEL SECURITY;

-- Grant access to service role (no public access)
GRANT ALL ON public.signup_otps TO service_role;

-- Also ensure app_settings table exists for admin subscription controls
CREATE TABLE IF NOT EXISTS public.app_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value JSONB,
    updated_by UUID,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default pricing values
INSERT INTO public.app_settings (key, value) VALUES
    ('premium_monthly_price', '29'),
    ('premium_annual_price', '249'),
    ('annual_discount_months', '2')
ON CONFLICT (key) DO NOTHING;

-- Grant access
GRANT ALL ON public.app_settings TO service_role;
GRANT SELECT ON public.app_settings TO anon, authenticated;
