-- ====================================================================
-- FEATURE: COURSES & CURRICULUM (02_feature_courses_and_curriculum.sql)
-- GVM EDULMS — Course Catalog, Categories, Chapters, Lectures & Notes
-- Run in Supabase SQL Editor: Dashboard -> SQL Editor -> New Query -> Run
-- ====================================================================

-- 1. COURSE CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.course_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE,
    description TEXT,
    color TEXT DEFAULT '#6366f1',
    is_default BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_course_categories_slug ON public.course_categories(slug);

ALTER TABLE public.course_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read on course_categories" ON public.course_categories;
DROP POLICY IF EXISTS "Allow write on course_categories" ON public.course_categories;
CREATE POLICY "Allow read on course_categories" ON public.course_categories FOR SELECT USING (true);
CREATE POLICY "Allow write on course_categories" ON public.course_categories FOR ALL USING (true);

-- 2. COURSES TABLE
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES public."Profile"(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    category TEXT DEFAULT 'General',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    price NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_courses_teacher_id ON public.courses(teacher_id);
CREATE INDEX IF NOT EXISTS idx_courses_status ON public.courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_category ON public.courses(category);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read on courses" ON public.courses;
DROP POLICY IF EXISTS "Allow write on courses" ON public.courses;
CREATE POLICY "Allow read on courses" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Allow write on courses" ON public.courses FOR ALL USING (true);

-- 3. CHAPTERS TABLE (Syllabus Sections)
CREATE TABLE IF NOT EXISTS public.chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    chapter_order INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chapters_course_id ON public.chapters(course_id);

ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read on chapters" ON public.chapters;
DROP POLICY IF EXISTS "Allow write on chapters" ON public.chapters;
CREATE POLICY "Allow read on chapters" ON public.chapters FOR SELECT USING (true);
CREATE POLICY "Allow write on chapters" ON public.chapters FOR ALL USING (true);

-- 4. LECTURES TABLE (Video Lessons & Materials)
CREATE TABLE IF NOT EXISTS public.lectures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    video_path TEXT,
    duration INTEGER DEFAULT 0, -- Duration in seconds
    lecture_order INTEGER NOT NULL DEFAULT 1,
    is_published BOOLEAN NOT NULL DEFAULT true,
    is_free_preview BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure correct data type if table existed previously with legacy types
ALTER TABLE public.lectures ALTER COLUMN title TYPE TEXT;
ALTER TABLE public.lectures ADD COLUMN IF NOT EXISTS is_free_preview BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_lectures_chapter_id ON public.lectures(chapter_id);

ALTER TABLE public.lectures ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read on lectures" ON public.lectures;
DROP POLICY IF EXISTS "Allow write on lectures" ON public.lectures;
CREATE POLICY "Allow read on lectures" ON public.lectures FOR SELECT USING (true);
CREATE POLICY "Allow write on lectures" ON public.lectures FOR ALL USING (true);

-- 5. NOTES & ATTACHMENTS TABLE (Downloadable study materials & PDFs)
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lecture_id UUID NOT NULL REFERENCES public.lectures(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT DEFAULT 'application/pdf',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notes_lecture_id ON public.notes(lecture_id);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read on notes" ON public.notes;
DROP POLICY IF EXISTS "Allow write on notes" ON public.notes;
CREATE POLICY "Allow read on notes" ON public.notes FOR SELECT USING (true);
CREATE POLICY "Allow write on notes" ON public.notes FOR ALL USING (true);
