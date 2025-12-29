-- Add missing columns to check_ins if they don't exist
ALTER TABLE check_ins ADD COLUMN IF NOT EXISTS sleep INTEGER;
ALTER TABLE check_ins ADD COLUMN IF NOT EXISTS connection INTEGER;
ALTER TABLE check_ins ADD COLUMN IF NOT EXISTS stress INTEGER;

-- Verify columns exist (this will just run without error if they do)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'check_ins' AND column_name = 'sleep') THEN
        RAISE NOTICE 'Added sleep column';
    END IF;
END $$;
