-- ====================================================================
-- QUICK FIX FOR LECTURES TABLE
-- Run this in your Supabase SQL Editor:
-- Dashboard (https://supabase.com/dashboard/project/ansszvwhfcmdmmtosdgv/sql/new)
-- ====================================================================

-- 1. Fix lectures.title column type to TEXT (it was originally created as TIME)
ALTER TABLE public.lectures ALTER COLUMN title TYPE TEXT;

-- 2. Add is_free_preview column if missing
ALTER TABLE public.lectures ADD COLUMN IF NOT EXISTS is_free_preview BOOLEAN NOT NULL DEFAULT false;

-- 3. Ensure RLS allows insert & select
ALTER TABLE public.lectures ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access on lectures" ON public.lectures;
DROP POLICY IF EXISTS "Allow public write access on lectures" ON public.lectures;
CREATE POLICY "Allow public read access on lectures" ON public.lectures FOR SELECT USING (true);
CREATE POLICY "Allow public write access on lectures" ON public.lectures FOR ALL USING (true);
