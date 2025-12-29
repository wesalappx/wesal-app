-- =============================================
-- WESAL APP - Complete Supabase Setup
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. PROFILES TABLE & TRIGGER
-- Auto-create profiles when users sign up
-- =============================================

-- Create profiles table if not exists
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view partner profile" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view partner profile" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM couples
            WHERE (partner1_id = auth.uid() AND partner2_id = id)
               OR (partner2_id = auth.uid() AND partner1_id = id)
        )
    );

-- Auto-create profile trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, avatar_url)
    VALUES (
        new.id,
        COALESCE(
            new.raw_user_meta_data->>'display_name',
            new.raw_user_meta_data->>'full_name',
            new.raw_user_meta_data->>'name',
            split_part(new.email, '@', 1)
        ),
        new.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE SET
        display_name = COALESCE(EXCLUDED.display_name, profiles.display_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
        updated_at = NOW();
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update existing users without display_name
UPDATE public.profiles p
SET display_name = COALESCE(
    u.raw_user_meta_data->>'display_name',
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    split_part(u.email, '@', 1)
)
FROM auth.users u
WHERE p.id = u.id AND (p.display_name IS NULL OR p.display_name = '');


-- 2. CHECK_INS TABLE - Add missing columns
-- =============================================

ALTER TABLE check_ins ADD COLUMN IF NOT EXISTS sleep INTEGER;
ALTER TABLE check_ins ADD COLUMN IF NOT EXISTS connection INTEGER;


-- 3. WHISPERS TABLE
-- For the Private Whisper feature
-- =============================================

CREATE TABLE IF NOT EXISTS whispers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    couple_id UUID REFERENCES couples(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id),
    message_id TEXT NOT NULL,
    scheduled_time TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'later', 'not_now', 'expired')),
    response_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    responded_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE whispers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for whispers
DROP POLICY IF EXISTS "Couple members can view whispers" ON whispers;
DROP POLICY IF EXISTS "Couple members can insert whispers" ON whispers;
DROP POLICY IF EXISTS "Couple members can update whispers" ON whispers;
DROP POLICY IF EXISTS "Couple members can delete whispers" ON whispers;

CREATE POLICY "Couple members can view whispers" ON whispers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM couples
            WHERE id = whispers.couple_id
            AND (partner1_id = auth.uid() OR partner2_id = auth.uid())
        )
    );

CREATE POLICY "Couple members can insert whispers" ON whispers
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM couples
            WHERE id = couple_id
            AND (partner1_id = auth.uid() OR partner2_id = auth.uid())
        )
    );

CREATE POLICY "Couple members can update whispers" ON whispers
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM couples
            WHERE id = whispers.couple_id
            AND (partner1_id = auth.uid() OR partner2_id = auth.uid())
        )
    );

CREATE POLICY "Couple members can delete whispers" ON whispers
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM couples
            WHERE id = whispers.couple_id
            AND (partner1_id = auth.uid() OR partner2_id = auth.uid())
        )
    );

-- Enable Realtime for whispers
ALTER PUBLICATION supabase_realtime ADD TABLE whispers;


-- 4. COUPLES TABLE - Ensure RLS is correct
-- =============================================

ALTER TABLE couples ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own couple" ON couples;
DROP POLICY IF EXISTS "Users can insert couple" ON couples;
DROP POLICY IF EXISTS "Users can update own couple" ON couples;

CREATE POLICY "Users can view own couple" ON couples
    FOR SELECT USING (partner1_id = auth.uid() OR partner2_id = auth.uid());

CREATE POLICY "Users can insert couple" ON couples
    FOR INSERT WITH CHECK (partner1_id = auth.uid() OR partner2_id = auth.uid());

CREATE POLICY "Users can update own couple" ON couples
    FOR UPDATE USING (partner1_id = auth.uid() OR partner2_id = auth.uid());


-- 5. CONFLICT_SESSIONS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS conflict_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    couple_id UUID REFERENCES couples(id) ON DELETE CASCADE,
    initiator_id UUID REFERENCES auth.users(id),
    topic TEXT,
    status TEXT DEFAULT 'created' CHECK (status IN ('created', 'joined', 'inputting', 'analyzing', 'verdict', 'completed')),
    p1_input TEXT,
    p2_input TEXT,
    p1_submitted BOOLEAN DEFAULT FALSE,
    p2_submitted BOOLEAN DEFAULT FALSE,
    chat_history JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

ALTER TABLE conflict_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Couple members can access conflict sessions" ON conflict_sessions;

CREATE POLICY "Couple members can access conflict sessions" ON conflict_sessions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM couples
            WHERE id = conflict_sessions.couple_id
            AND (partner1_id = auth.uid() OR partner2_id = auth.uid())
        )
    );

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE conflict_sessions;


-- 6. NOTIFICATIONS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title_ar TEXT,
    title_en TEXT,
    body_ar TEXT,
    body_en TEXT,
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert notifications" ON notifications
    FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

ALTER PUBLICATION supabase_realtime ADD TABLE notifications;


-- =============================================
-- DONE! All tables and policies configured.
-- =============================================
