# Additional Schema: Conflict Sessions

To enable the "Collaborative Conflict Resolution" feature, run this SQL:

```sql
-- Conflict Sessions Table
CREATE TABLE IF NOT EXISTS public.conflict_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE NOT NULL,
    initiator_id UUID REFERENCES public.profiles(id) NOT NULL,
    status TEXT DEFAULT 'created', -- created, joined, inputting, analyzing, verdict, completed
    topic TEXT,
    
    p1_input TEXT,
    p1_submitted BOOLEAN DEFAULT FALSE,
    
    p2_input TEXT,
    p2_submitted BOOLEAN DEFAULT FALSE,
    
    verdict TEXT,
    chat_history JSONB DEFAULT '[]',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.conflict_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Couple can view conflict sessions" ON public.conflict_sessions
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.couples WHERE id = couple_id 
        AND (partner1_id = auth.uid() OR partner2_id = auth.uid())
    ));

CREATE POLICY "Couple can insert conflict sessions" ON public.conflict_sessions
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM public.couples WHERE id = couple_id 
        AND (partner1_id = auth.uid() OR partner2_id = auth.uid())
    ));

CREATE POLICY "Couple can update conflict sessions" ON public.conflict_sessions
    FOR UPDATE USING (EXISTS (
        SELECT 1 FROM public.couples WHERE id = couple_id 
        AND (partner1_id = auth.uid() OR partner2_id = auth.uid())
    ));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.conflict_sessions;
```
