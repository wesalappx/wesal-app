-- FIX MISSING TABLES & SYNC USERS
-- Run this in Supabase SQL Editor

-- 1. Create Core Tables (if they don't exist)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    gender TEXT CHECK (gender IN ('MALE', 'FEMALE')),
    date_of_birth DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.couples (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    partner1_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    partner2_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'ACTIVE',
    paired_at TIMESTAMPTZ DEFAULT NOW(),
    unpaired_at TIMESTAMPTZ,
    UNIQUE(partner1_id),
    UNIQUE(partner2_id)
);
ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.check_ins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    mood INT CHECK (mood BETWEEN 1 AND 5) NOT NULL,
    energy INT CHECK (energy BETWEEN 1 AND 5) NOT NULL,
    stress INT CHECK (stress BETWEEN 1 AND 5) NOT NULL,
    sleep INT,
    connection INT,
    shared_with_partner BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.game_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE NOT NULL,
    game_type TEXT NOT NULL,
    status TEXT DEFAULT 'ACTIVE',
    current_state JSONB DEFAULT '{}'::JSONB,
    last_action_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL,
    title_ar TEXT,
    title_en TEXT,
    body_ar TEXT,
    body_en TEXT,
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 2. Sync Existing Users (Fix "User not showing" issue)
-- This copies any user from Authentication who is missing in public.profiles
INSERT INTO public.profiles (id, display_name)
SELECT id, COALESCE(raw_user_meta_data->>'display_name', email, 'User')
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- 3. Update Policies (Optional safety check)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
    );
