-- ============================================
-- COMPREHENSIVE DATABASE FIX SCRIPT
-- Run this in Supabase SQL Editor
-- Fixes all 400/406 errors in console
-- ============================================

-- 1. FIX: secret_sparks table
-- ============================================
DO $$ 
BEGIN
    -- Add user_id column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'secret_sparks' AND column_name = 'user_id') THEN
        ALTER TABLE secret_sparks ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
    
    -- Add partner_id column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'secret_sparks' AND column_name = 'partner_id') THEN
        ALTER TABLE secret_sparks ADD COLUMN partner_id UUID REFERENCES auth.users(id);
    END IF;
    
    -- Add status column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'secret_sparks' AND column_name = 'status') THEN
        ALTER TABLE secret_sparks ADD COLUMN status TEXT DEFAULT 'NEW';
    END IF;
END $$;

-- 2. FIX: game_sessions table
-- ============================================
DO $$ 
BEGIN
    -- Add current_state column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'game_sessions' AND column_name = 'current_state') THEN
        ALTER TABLE game_sessions ADD COLUMN current_state JSONB DEFAULT '{}';
    END IF;
    
    -- Add game_type column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'game_sessions' AND column_name = 'game_type') THEN
        ALTER TABLE game_sessions ADD COLUMN game_type TEXT;
    END IF;
    
    -- Add couple_id column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'game_sessions' AND column_name = 'couple_id') THEN
        ALTER TABLE game_sessions ADD COLUMN couple_id UUID REFERENCES couples(id);
    END IF;
END $$;

-- 3. FIX: check_ins table
-- ============================================
DO $$ 
BEGIN
    -- Add shared_with_partner column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'check_ins' AND column_name = 'shared_with_partner') THEN
        ALTER TABLE check_ins ADD COLUMN shared_with_partner BOOLEAN DEFAULT false;
    END IF;
    
    -- Add user_id column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'check_ins' AND column_name = 'user_id') THEN
        ALTER TABLE check_ins ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- 4. FIX: journey_progress table
-- ============================================
DO $$ 
BEGIN
    -- Add couple_id column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'journey_progress' AND column_name = 'couple_id') THEN
        ALTER TABLE journey_progress ADD COLUMN couple_id UUID REFERENCES couples(id);
    END IF;
    
    -- Add journey_type column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'journey_progress' AND column_name = 'journey_type') THEN
        ALTER TABLE journey_progress ADD COLUMN journey_type TEXT;
    END IF;
END $$;

-- Create unique constraint for journey_progress upsert if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'journey_progress_couple_id_journey_type_key'
    ) THEN
        ALTER TABLE journey_progress 
        ADD CONSTRAINT journey_progress_couple_id_journey_type_key 
        UNIQUE (couple_id, journey_type);
    END IF;
EXCEPTION WHEN duplicate_table THEN
    -- Constraint already exists
END $$;

-- 5. FIX: notes table - ensure category enum is correct
-- ============================================
-- No changes needed - category is validated in frontend now

-- 6. Enable RLS on all tables
-- ============================================
ALTER TABLE secret_sparks ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for secret_sparks
-- ============================================
DROP POLICY IF EXISTS "Users can view their own secret sparks" ON secret_sparks;
CREATE POLICY "Users can view their own secret sparks" ON secret_sparks
    FOR SELECT USING (
        auth.uid() = user_id OR auth.uid() = partner_id
    );

DROP POLICY IF EXISTS "Users can insert their own secret sparks" ON secret_sparks;
CREATE POLICY "Users can insert their own secret sparks" ON secret_sparks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own secret sparks" ON secret_sparks;
CREATE POLICY "Users can update their own secret sparks" ON secret_sparks
    FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = partner_id);

-- 8. Create RLS policies for game_sessions
-- ============================================
DROP POLICY IF EXISTS "Users can view their couple game sessions" ON game_sessions;
CREATE POLICY "Users can view their couple game sessions" ON game_sessions
    FOR SELECT USING (
        couple_id IN (
            SELECT id FROM couples 
            WHERE partner1_id = auth.uid() OR partner2_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert game sessions for their couple" ON game_sessions;
CREATE POLICY "Users can insert game sessions for their couple" ON game_sessions
    FOR INSERT WITH CHECK (
        couple_id IN (
            SELECT id FROM couples 
            WHERE partner1_id = auth.uid() OR partner2_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update their couple game sessions" ON game_sessions;
CREATE POLICY "Users can update their couple game sessions" ON game_sessions
    FOR UPDATE USING (
        couple_id IN (
            SELECT id FROM couples 
            WHERE partner1_id = auth.uid() OR partner2_id = auth.uid()
        )
    );

-- 9. Create RLS policies for check_ins
-- ============================================
DROP POLICY IF EXISTS "Users can view their own check-ins" ON check_ins;
CREATE POLICY "Users can view their own check-ins" ON check_ins
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view partner check-ins if shared" ON check_ins;
CREATE POLICY "Users can view partner check-ins if shared" ON check_ins
    FOR SELECT USING (
        shared_with_partner = true AND user_id IN (
            SELECT CASE 
                WHEN partner1_id = auth.uid() THEN partner2_id
                WHEN partner2_id = auth.uid() THEN partner1_id
            END
            FROM couples
            WHERE partner1_id = auth.uid() OR partner2_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert their own check-ins" ON check_ins;
CREATE POLICY "Users can insert their own check-ins" ON check_ins
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own check-ins" ON check_ins;
CREATE POLICY "Users can update their own check-ins" ON check_ins
    FOR UPDATE USING (auth.uid() = user_id);

-- 10. Create RLS policies for journey_progress
-- ============================================
DROP POLICY IF EXISTS "Users can view their couple journey progress" ON journey_progress;
CREATE POLICY "Users can view their couple journey progress" ON journey_progress
    FOR SELECT USING (
        couple_id IN (
            SELECT id FROM couples 
            WHERE partner1_id = auth.uid() OR partner2_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can upsert their couple journey progress" ON journey_progress;
CREATE POLICY "Users can upsert their couple journey progress" ON journey_progress
    FOR ALL USING (
        couple_id IN (
            SELECT id FROM couples 
            WHERE partner1_id = auth.uid() OR partner2_id = auth.uid()
        )
    );

-- 11. Create RLS policies for notes
-- ============================================
DROP POLICY IF EXISTS "Users can view their couple notes" ON notes;
CREATE POLICY "Users can view their couple notes" ON notes
    FOR SELECT USING (
        couple_id IN (
            SELECT id FROM couples 
            WHERE partner1_id = auth.uid() OR partner2_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert notes for their couple" ON notes;
CREATE POLICY "Users can insert notes for their couple" ON notes
    FOR INSERT WITH CHECK (
        couple_id IN (
            SELECT id FROM couples 
            WHERE partner1_id = auth.uid() OR partner2_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update their couple notes" ON notes;
CREATE POLICY "Users can update their couple notes" ON notes
    FOR UPDATE USING (
        couple_id IN (
            SELECT id FROM couples 
            WHERE partner1_id = auth.uid() OR partner2_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete their couple notes" ON notes;
CREATE POLICY "Users can delete their couple notes" ON notes
    FOR DELETE USING (
        couple_id IN (
            SELECT id FROM couples 
            WHERE partner1_id = auth.uid() OR partner2_id = auth.uid()
        )
    );

-- ============================================
-- DONE! All tables should now work correctly
-- ============================================
SELECT 'Database fix complete!' as status;
