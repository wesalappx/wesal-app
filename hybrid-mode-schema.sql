-- ============================================================================
-- WESAL HYBRID MODE SCHEMA MIGRATION
-- ============================================================================
-- This file adds the 'relationship_stage' feature to support both
-- Pre-Marriage (Khatba) and Post-Marriage modes in the same app.
-- SAFE TO RUN MULTIPLE TIMES (uses IF NOT EXISTS)
-- ============================================================================

-- ============================================
-- 1. ADD relationship_stage TO profiles
-- ============================================

-- Add the relationship_stage column
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'relationship_stage') THEN
        ALTER TABLE public.profiles ADD COLUMN relationship_stage TEXT DEFAULT 'married' CHECK (relationship_stage IN ('khatba', 'married', 'dating'));
    END IF;
END $$;

-- Add khatba_details for future metadata (e.g., engagement date)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'khatba_details') THEN
        ALTER TABLE public.profiles ADD COLUMN khatba_details JSONB DEFAULT '{}'::JSONB;
    END IF;
END $$;

-- ============================================
-- 2. VISION BOARDS (Future Builder Feature)
-- ============================================

CREATE TABLE IF NOT EXISTS public.vision_boards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    category TEXT NOT NULL CHECK (category IN ('home', 'wedding', 'lifestyle', 'travel', 'other')),
    title TEXT NOT NULL,
    image_url TEXT,
    note TEXT,
    is_hidden BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.vision_boards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Couple members can manage vision boards" ON public.vision_boards;
CREATE POLICY "Couple members can manage vision boards" ON public.vision_boards
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.couples
            WHERE id = couple_id
            AND (partner1_id = auth.uid() OR partner2_id = auth.uid())
        )
    );

CREATE INDEX IF NOT EXISTS idx_vision_boards_couple_id ON public.vision_boards(couple_id);

-- ============================================
-- 3. BUDGETS (Budget Co-Pilot Feature)
-- ============================================

CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    category TEXT NOT NULL CHECK (category IN ('wedding', 'mahr', 'furniture', 'honeymoon', 'housing', 'other')),
    item_name TEXT NOT NULL,
    estimated_cost DECIMAL(12, 2),
    actual_cost DECIMAL(12, 2),
    paid_by TEXT CHECK (paid_by IN ('partner1', 'partner2', 'shared', 'family')),
    is_completed BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Couple members can manage budgets" ON public.budgets;
CREATE POLICY "Couple members can manage budgets" ON public.budgets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.couples
            WHERE id = couple_id
            AND (partner1_id = auth.uid() OR partner2_id = auth.uid())
        )
    );

CREATE INDEX IF NOT EXISTS idx_budgets_couple_id ON public.budgets(couple_id);

-- ============================================
-- 4. COMPATIBILITY ANSWERS (Dealbreaker Test)
-- ============================================

CREATE TABLE IF NOT EXISTS public.compatibility_answers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    question_id TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('finances', 'living', 'family', 'lifestyle', 'values', 'intimacy')),
    answer JSONB NOT NULL,
    is_dealbreaker BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(couple_id, user_id, question_id)
);

ALTER TABLE public.compatibility_answers ENABLE ROW LEVEL SECURITY;

-- Users can only see their OWN answers (partner's answers are revealed via API)
DROP POLICY IF EXISTS "Users can manage own compatibility answers" ON public.compatibility_answers;
CREATE POLICY "Users can manage own compatibility answers" ON public.compatibility_answers
    FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_compatibility_answers_couple_id ON public.compatibility_answers(couple_id);
CREATE INDEX IF NOT EXISTS idx_compatibility_answers_user_id ON public.compatibility_answers(user_id);

-- ============================================
-- 5. GAME VISIBILITY (for Khatba Safe Games)
-- ============================================

-- Add 'khatba_safe' flag to games config
-- This will be managed via app_settings JSON instead of a new table

INSERT INTO public.app_settings (key, value, description, category) VALUES
    ('khatba_enabled_games', '["truth", "compatibility", "trivia", "would-you-rather"]'::JSONB, 'Games available in Khatba mode', 'khatba'),
    ('khatba_disabled_features', '["dare", "intimacy-games", "secret-sparks-reveal"]'::JSONB, 'Features disabled in Khatba mode', 'khatba')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- DONE! Hybrid Mode Schema is ready.
-- ============================================
