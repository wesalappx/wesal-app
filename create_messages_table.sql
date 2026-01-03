-- Create messages table for persistent Dashboard Chat
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Couple members can view messages" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.couples
            WHERE id = couple_id
            AND (partner1_id = auth.uid() OR partner2_id = auth.uid())
        )
    );

CREATE POLICY "Couple members can insert messages" ON public.messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.couples
            WHERE id = couple_id
            AND (partner1_id = auth.uid() OR partner2_id = auth.uid())
        )
        AND sender_id = auth.uid()
    );

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_messages_couple_id_created_at ON public.messages(couple_id, created_at ASC);

-- Add to publication for Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
