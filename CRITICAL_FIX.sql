-- =============================================
-- CRITICAL FIX: Run this in Supabase SQL Editor
-- Fixes: Stress, Sleep, Streak issues
-- =============================================

-- 1. ENSURE check_ins HAS ALL REQUIRED COLUMNS
-- =============================================
ALTER TABLE check_ins ADD COLUMN IF NOT EXISTS sleep INTEGER CHECK (sleep BETWEEN 1 AND 5);
ALTER TABLE check_ins ADD COLUMN IF NOT EXISTS connection INTEGER CHECK (connection BETWEEN 1 AND 5);
ALTER TABLE check_ins ADD COLUMN IF NOT EXISTS stress INTEGER CHECK (stress BETWEEN 1 AND 5);

-- Verify (this will just show notice, won't fail)
DO $$
BEGIN
    RAISE NOTICE 'check_ins columns verified: sleep, connection, stress';
END $$;


-- 2. FIX STREAKS TABLE POLICIES (Allow UPDATE and INSERT)
-- =============================================
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Couple members can update streaks" ON streaks;
DROP POLICY IF EXISTS "Couple members can insert streaks" ON streaks;

-- Create proper policies
CREATE POLICY "Couple members can update streaks" ON streaks
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM couples
            WHERE id = streaks.couple_id
            AND (partner1_id = auth.uid() OR partner2_id = auth.uid())
        )
    );

CREATE POLICY "Couple members can insert streaks" ON streaks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM couples
            WHERE id = couple_id
            AND (partner1_id = auth.uid() OR partner2_id = auth.uid())
        )
    );


-- 3. CREATE MISSING STREAK ROWS FOR EXISTING COUPLES
-- (If a couple exists but has no streak row, create one)
-- =============================================
INSERT INTO streaks (couple_id, current_streak, longest_streak, updated_at)
SELECT c.id, 0, 0, NOW()
FROM couples c
WHERE c.status = 'ACTIVE'
AND NOT EXISTS (SELECT 1 FROM streaks s WHERE s.couple_id = c.id);


-- 4. ADD TRIGGER TO AUTO-CREATE STREAK ROW ON NEW COUPLE
-- =============================================
CREATE OR REPLACE FUNCTION create_streak_for_couple()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO streaks (couple_id, current_streak, longest_streak, updated_at)
    VALUES (NEW.id, 0, 0, NOW())
    ON CONFLICT (couple_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_couple_created ON couples;
CREATE TRIGGER on_couple_created
    AFTER INSERT ON couples
    FOR EACH ROW EXECUTE FUNCTION create_streak_for_couple();


-- 5. VERIFY check_ins table has required columns (INFORMATIONAL)
-- =============================================
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'check_ins' 
AND column_name IN ('mood', 'energy', 'stress', 'sleep', 'connection');


-- =============================================
-- DONE! You should now see:
--   - check_ins has: mood, energy, stress, sleep, connection
--   - streaks has UPDATE and INSERT policies
--   - All existing couples have a streak row
-- =============================================
