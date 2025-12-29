-- Wesal AI Database Schema
-- Run this in Supabase SQL Editor

-- 1. Couple's Shared Notes
CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID REFERENCES couples(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    category TEXT DEFAULT 'general' CHECK (category IN ('general', 'journey', 'budget', 'wishlist', 'memories')),
    is_pinned BOOLEAN DEFAULT false,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Special Dates (Anniversaries, Birthdays)
CREATE TABLE IF NOT EXISTS special_dates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID REFERENCES couples(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    event_date DATE NOT NULL,
    event_type TEXT DEFAULT 'custom' CHECK (event_type IN ('birthday', 'anniversary', 'first_date', 'first_kiss', 'wedding', 'custom')),
    reminder_days INTEGER DEFAULT 7,
    notes TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Budget Goals
CREATE TABLE IF NOT EXISTS budget_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID REFERENCES couples(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    target_amount DECIMAL(10,2) NOT NULL,
    current_amount DECIMAL(10,2) DEFAULT 0,
    deadline DATE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. AI Chat History
CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID REFERENCES couples(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id),
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    mode TEXT DEFAULT 'normal' CHECK (mode IN ('normal', 'conflict')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE special_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notes
CREATE POLICY "Users can view their couple's notes" ON notes
    FOR SELECT USING (
        couple_id IN (SELECT id FROM couples WHERE partner1_id = auth.uid() OR partner2_id = auth.uid())
    );

CREATE POLICY "Users can create notes for their couple" ON notes
    FOR INSERT WITH CHECK (
        couple_id IN (SELECT id FROM couples WHERE partner1_id = auth.uid() OR partner2_id = auth.uid())
    );

CREATE POLICY "Users can update their couple's notes" ON notes
    FOR UPDATE USING (
        couple_id IN (SELECT id FROM couples WHERE partner1_id = auth.uid() OR partner2_id = auth.uid())
    );

CREATE POLICY "Users can delete their couple's notes" ON notes
    FOR DELETE USING (
        couple_id IN (SELECT id FROM couples WHERE partner1_id = auth.uid() OR partner2_id = auth.uid())
    );

-- RLS Policies for special_dates
CREATE POLICY "Users can view their couple's special dates" ON special_dates
    FOR SELECT USING (
        couple_id IN (SELECT id FROM couples WHERE partner1_id = auth.uid() OR partner2_id = auth.uid())
    );

CREATE POLICY "Users can manage their couple's special dates" ON special_dates
    FOR ALL USING (
        couple_id IN (SELECT id FROM couples WHERE partner1_id = auth.uid() OR partner2_id = auth.uid())
    );

-- RLS Policies for budget_goals
CREATE POLICY "Users can view their couple's budget goals" ON budget_goals
    FOR SELECT USING (
        couple_id IN (SELECT id FROM couples WHERE partner1_id = auth.uid() OR partner2_id = auth.uid())
    );

CREATE POLICY "Users can manage their couple's budget goals" ON budget_goals
    FOR ALL USING (
        couple_id IN (SELECT id FROM couples WHERE partner1_id = auth.uid() OR partner2_id = auth.uid())
    );

-- RLS Policies for ai_conversations
CREATE POLICY "Users can view their couple's AI conversations" ON ai_conversations
    FOR SELECT USING (
        couple_id IN (SELECT id FROM couples WHERE partner1_id = auth.uid() OR partner2_id = auth.uid())
    );

CREATE POLICY "Users can create AI conversations" ON ai_conversations
    FOR INSERT WITH CHECK (
        couple_id IN (SELECT id FROM couples WHERE partner1_id = auth.uid() OR partner2_id = auth.uid())
    );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notes_couple_id ON notes(couple_id);
CREATE INDEX IF NOT EXISTS idx_special_dates_couple_id ON special_dates(couple_id);
CREATE INDEX IF NOT EXISTS idx_budget_goals_couple_id ON budget_goals(couple_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_couple_id ON ai_conversations(couple_id);
