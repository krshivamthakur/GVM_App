-- ====================================================================
-- FEATURE: ENROLLMENTS & PROGRESS (03_feature_enrollments_and_progress.sql)
-- GVM EDULMS — Multi-Course Student Enrollment & Lecture Progress Tracking
-- Run in Supabase SQL Editor: Dashboard -> SQL Editor -> New Query -> Run
-- ====================================================================

-- 1. ENROLLMENTS TABLE (Connects Students to Multiple Courses)
CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public."Profile"(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired', 'revoked')),
    UNIQUE(student_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON public.enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON public.enrollments(course_id);

ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read on enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Allow write on enrollments" ON public.enrollments;
CREATE POLICY "Allow read on enrollments" ON public.enrollments FOR SELECT USING (true);
CREATE POLICY "Allow write on enrollments" ON public.enrollments FOR ALL USING (true);

-- 2. LECTURE PROGRESS TABLE (Tracks per-lecture watch time & completion)
CREATE TABLE IF NOT EXISTS public.lecture_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public."Profile"(id) ON DELETE CASCADE,
    lecture_id UUID NOT NULL REFERENCES public.lectures(id) ON DELETE CASCADE,
    watched_seconds INTEGER NOT NULL DEFAULT 0,
    completed BOOLEAN NOT NULL DEFAULT false,
    last_watched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, lecture_id)
);

CREATE INDEX IF NOT EXISTS idx_lecture_progress_student_id ON public.lecture_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_lecture_progress_lecture_id ON public.lecture_progress(lecture_id);

ALTER TABLE public.lecture_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read on lecture_progress" ON public.lecture_progress;
DROP POLICY IF EXISTS "Allow write on lecture_progress" ON public.lecture_progress;
CREATE POLICY "Allow read on lecture_progress" ON public.lecture_progress FOR SELECT USING (true);
CREATE POLICY "Allow write on lecture_progress" ON public.lecture_progress FOR ALL USING (true);
