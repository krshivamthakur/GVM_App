-- ====================================================================
-- GVM EDULMS — MULTI-COURSE ENROLLMENT SCHEMA & PROCEDURES
-- Enables students to join and manage multiple courses concurrently.
-- Run in your Supabase SQL Editor:
-- Dashboard -> SQL Editor -> New Query -> Paste & Run
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. VERIFY / CREATE ENROLLMENTS TABLE
-- Note: UNIQUE(student_id, course_id) allows a student to enroll in
-- UNLIMITED different courses while preventing duplicate enrollments.
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'active',
    UNIQUE(student_id, course_id)
);

-- Ensure status column exists if table was already created previously
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

-- Fast lookup indexes
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON public.enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON public.enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_enrolled_at ON public.enrollments(enrolled_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- Reset policies
DROP POLICY IF EXISTS "Allow public read access on enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Allow public write access on enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Students can view their own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Students can enroll themselves" ON public.enrollments;
DROP POLICY IF EXISTS "Students can unenroll themselves" ON public.enrollments;

-- RLS Policy: Read access
CREATE POLICY "Allow public read access on enrollments" 
ON public.enrollments FOR SELECT 
USING (true);

-- RLS Policy: Write / Insert / Update / Delete access
CREATE POLICY "Allow public write access on enrollments" 
ON public.enrollments FOR ALL 
USING (true);


-- --------------------------------------------------------------------
-- 2. STORED PROCEDURE: BATCH ENROLL IN MULTIPLE COURSES
-- Allows a student to join an array of course IDs in a single transaction
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enroll_student_multiple_courses(
    p_student_id UUID,
    p_course_ids UUID[]
)
RETURNS TABLE (
    enrolled_course_id UUID,
    is_new BOOLEAN
) AS $$
DECLARE
    cid UUID;
BEGIN
    FOREACH cid IN ARRAY p_course_ids
    LOOP
        -- Check if enrollment already exists
        IF NOT EXISTS (
            SELECT 1 FROM public.enrollments 
            WHERE student_id = p_student_id AND course_id = cid
        ) THEN
            INSERT INTO public.enrollments (student_id, course_id, enrolled_at)
            VALUES (p_student_id, cid, NOW());
            
            enrolled_course_id := cid;
            is_new := TRUE;
            RETURN NEXT;
        ELSE
            enrolled_course_id := cid;
            is_new := FALSE;
            RETURN NEXT;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- --------------------------------------------------------------------
-- 3. STORED PROCEDURE: BATCH UNENROLL FROM COURSES
-- Allows a student to leave one or multiple courses
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.unenroll_student_courses(
    p_student_id UUID,
    p_course_ids UUID[]
)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.enrollments
    WHERE student_id = p_student_id
      AND course_id = ANY(p_course_ids);
      
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- --------------------------------------------------------------------
-- 4. VIEW: STUDENT ENROLLED COURSES WITH METRICS
-- Provides a clean view of all courses joined by students with instructor details
-- --------------------------------------------------------------------

-- Ensure status column exists on enrollments if table pre-existed
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

CREATE OR REPLACE VIEW public.student_enrolled_courses_view AS
SELECT 
    e.id AS enrollment_id,
    e.student_id,
    e.enrolled_at,
    e.status AS enrollment_status,
    c.id AS course_id,
    c.title AS course_title,
    c.description AS course_description,
    c.thumbnail_url,
    c.category,
    c.status AS course_status,
    p.id AS teacher_id,
    p.full_name AS teacher_name,
    p.avatar_url AS teacher_avatar,
    (SELECT COUNT(*) FROM public.lectures l 
     JOIN public.chapters ch ON ch.id = l.chapter_id 
     WHERE ch.course_id = c.id) AS total_lectures
FROM public.enrollments e
JOIN public.courses c ON c.id = e.course_id
LEFT JOIN public.profiles p ON p.id = c.teacher_id
ORDER BY e.enrolled_at DESC;
