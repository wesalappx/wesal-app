-- Add chat_history to active_sessions for live remote chat
ALTER TABLE active_sessions ADD COLUMN IF NOT EXISTS chat_history JSONB DEFAULT '[]'::jsonb;
