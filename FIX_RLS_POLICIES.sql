-- ============================================
-- FIX RLS POLICIES - Your columns exist and are correct
-- The 400 errors are because RLS policies are blocking access
-- ============================================

-- 1. FIX secret_sparks RLS
-- ============================================
DROP POLICY IF EXISTS "Users can view their own secret sparks" ON secret_sparks;
DROP POLICY IF EXISTS "Users can insert their own secret sparks" ON secret_sparks;
DROP POLICY IF EXISTS "Users can update their own secret sparks" ON secret_sparks;
DROP POLICY IF EXISTS "secret_sparks_select" ON secret_sparks;
DROP POLICY IF EXISTS "secret_sparks_insert" ON secret_sparks;
DROP POLICY IF EXISTS "secret_sparks_update" ON secret_sparks;

ALTER TABLE secret_sparks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "secret_sparks_select" ON secret_sparks
    FOR SELECT USING (
        auth.uid() = user_id OR 
        auth.uid() = requester_id OR 
        auth.uid() = partner_id
    );

CREATE POLICY "secret_sparks_insert" ON secret_sparks
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR 
        auth.uid() = requester_id
    );

CREATE POLICY "secret_sparks_update" ON secret_sparks
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        auth.uid() = requester_id OR 
        auth.uid() = partner_id
    );

-- 2. FIX game_sessions RLS
-- ============================================
DROP POLICY IF EXISTS "Users can view their couple game sessions" ON game_sessions;
DROP POLICY IF EXISTS "Users can insert game sessions for their couple" ON game_sessions;
DROP POLICY IF EXISTS "Users can update their couple game sessions" ON game_sessions;
DROP POLICY IF EXISTS "game_sessions_select" ON game_sessions;
DROP POLICY IF EXISTS "game_sessions_insert" ON game_sessions;
DROP POLICY IF EXISTS "game_sessions_update" ON game_sessions;
DROP POLICY IF EXISTS "game_sessions_all" ON game_sessions;

ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "game_sessions_all" ON game_sessions
    FOR ALL USING (
        couple_id IN (
            SELECT id FROM couples 
            WHERE partner1_id = auth.uid() OR partner2_id = auth.uid()
        )
    );

-- 3. FIX check_ins RLS
-- ============================================
DROP POLICY IF EXISTS "Users can view their own check-ins" ON check_ins;
DROP POLICY IF EXISTS "Users can view partner check-ins if shared" ON check_ins;
DROP POLICY IF EXISTS "Users can insert their own check-ins" ON check_ins;
DROP POLICY IF EXISTS "Users can update their own check-ins" ON check_ins;
DROP POLICY IF EXISTS "check_ins_select" ON check_ins;
DROP POLICY IF EXISTS "check_ins_insert" ON check_ins;
DROP POLICY IF EXISTS "check_ins_all" ON check_ins;

ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;

-- Allow users to see their own check-ins
CREATE POLICY "check_ins_own" ON check_ins
    FOR ALL USING (auth.uid() = user_id);

-- Allow users to see partner's shared check-ins
CREATE POLICY "check_ins_partner_shared" ON check_ins
    FOR SELECT USING (
        shared_with_partner = true 
        AND user_id IN (
            SELECT CASE 
                WHEN partner1_id = auth.uid() THEN partner2_id
                WHEN partner2_id = auth.uid() THEN partner1_id
            END
            FROM couples
            WHERE (partner1_id = auth.uid() OR partner2_id = auth.uid())
            AND status = 'ACTIVE'
        )
    );

-- 4. FIX journey_progress RLS
-- ============================================
DROP POLICY IF EXISTS "Users can view their couple journey progress" ON journey_progress;
DROP POLICY IF EXISTS "Users can upsert their couple journey progress" ON journey_progress;
DROP POLICY IF EXISTS "journey_progress_all" ON journey_progress;
DROP POLICY IF EXISTS "journey_progress_select" ON journey_progress;

ALTER TABLE journey_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "journey_progress_all" ON journey_progress
    FOR ALL USING (
        couple_id IN (
            SELECT id FROM couples 
            WHERE partner1_id = auth.uid() OR partner2_id = auth.uid()
        )
    );

-- 5. FIX notes RLS (already working but ensure policies exist)
-- ============================================
DROP POLICY IF EXISTS "Users can view their couple notes" ON notes;
DROP POLICY IF EXISTS "Users can insert notes for their couple" ON notes;
DROP POLICY IF EXISTS "Users can update their couple notes" ON notes;
DROP POLICY IF EXISTS "Users can delete their couple notes" ON notes;
DROP POLICY IF EXISTS "notes_all" ON notes;

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notes_all" ON notes
    FOR ALL USING (
        couple_id IN (
            SELECT id FROM couples 
            WHERE partner1_id = auth.uid() OR partner2_id = auth.uid()
        )
    );

-- 6. Add unique constraint for journey_progress upsert (if missing)
-- ============================================
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
EXCEPTION WHEN duplicate_object THEN
    NULL; -- already exists
END $$;

-- ============================================
-- DONE!
-- ============================================
SELECT 'RLS policies fixed!' as status;
