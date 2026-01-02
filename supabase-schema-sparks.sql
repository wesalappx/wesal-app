-- Create secret_sparks table for Double-Blind AI Mediation
create type spark_status as enum ('PENDING_AI', 'AI_PROPOSING', 'SOFT_REJECTED', 'ACCEPTED', 'REVEALED');

create table public.secret_sparks (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    
    requester_id uuid references public.profiles(id) on delete cascade not null,
    partner_id uuid references public.profiles(id) on delete cascade not null,
    
    content text not null, -- The actual secret desire (e.g. "I want to try Salsa")
    category text default 'General',
    
    status spark_status default 'PENDING_AI',
    
    -- AI Mediation Fields
    ai_probe_question text, -- "Hypothetically, how would you feel about dancing?"
    partner_response text, -- "I love dancing!"
    ai_verdict_reasoning text
);

-- RLS Policies
alter table public.secret_sparks enable row level security;

-- Requester can see their own requests
create policy "Users can view their own sparks"
    on public.secret_sparks for select
    using (auth.uid() = requester_id);

-- Partner can ONLY see sparks that are in 'AI_PROPOSING' status (and only the probe question)
-- But typically the API will handle this selectively. For raw access safety:
create policy "Partners can view active probes"
    on public.secret_sparks for select
    using (auth.uid() = partner_id and status = 'AI_PROPOSING');

-- Insert policy
create policy "Users can create sparks"
    on public.secret_sparks for insert
    with check (auth.uid() = requester_id);

-- Update policy (for the partner to answer, or requester to cancel)
create policy "Users can update their sparks"
    on public.secret_sparks for update
    using (auth.uid() = requester_id or auth.uid() = partner_id);
