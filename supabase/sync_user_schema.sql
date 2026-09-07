-- ====================================================================
-- QUICK SYNC FOR SUPABASE TABLES
-- Run this in your Supabase SQL Editor (1-Click Fix)
-- ====================================================================

-- 1. Fix lectures.title column type to TEXT (in case it was created as time)
ALTER TABLE public.lectures ALTER COLUMN title TYPE TEXT;

-- 2. Ensure enrollments table exists
CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Set default timestamp on lecture_progress
ALTER TABLE public.lecture_progress ALTER COLUMN last_watched_at SET DEFAULT NOW();

-- 4. Enable RLS or public access policies
ALTER TABLE public."Profile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lecture_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on Profile" ON public."Profile" FOR SELECT USING (true);
CREATE POLICY "Allow public write access on Profile" ON public."Profile" FOR ALL USING (true);

CREATE POLICY "Allow public read access on courses" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Allow public write access on courses" ON public.courses FOR ALL USING (true);

CREATE POLICY "Allow public read access on chapters" ON public.chapters FOR SELECT USING (true);
CREATE POLICY "Allow public write access on chapters" ON public.chapters FOR ALL USING (true);

CREATE POLICY "Allow public read access on lectures" ON public.lectures FOR SELECT USING (true);
CREATE POLICY "Allow public write access on lectures" ON public.lectures FOR ALL USING (true);

CREATE POLICY "Allow public read access on notes" ON public.notes FOR SELECT USING (true);
CREATE POLICY "Allow public write access on notes" ON public.notes FOR ALL USING (true);

CREATE POLICY "Allow public read access on lecture_progress" ON public.lecture_progress FOR SELECT USING (true);
CREATE POLICY "Allow public write access on lecture_progress" ON public.lecture_progress FOR ALL USING (true);

CREATE POLICY "Allow public read access on enrollments" ON public.enrollments FOR SELECT USING (true);
CREATE POLICY "Allow public write access on enrollments" ON public.enrollments FOR ALL USING (true);
