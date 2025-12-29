-- EMERGENCY PROFILES FIX - Run this in Supabase SQL Editor
-- This is a complete reset of the profiles table policies

-- 1. First, disable RLS temporarily to clear everything
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 2. Drop ALL existing policies
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', pol.policyname);
    END LOOP;
END $$;

-- 3. Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. Create simple, working policies
CREATE POLICY "Allow read access for all authenticated users"
ON profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow users to insert own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow users to update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- 5. Also allow service role full access
CREATE POLICY "Service role full access"
ON profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 6. Test query
SELECT id, display_name, avatar_url FROM profiles LIMIT 5;
