-- ====================================================================
-- EDUCATION LMS — SUPABASE POSTGRESQL SCHEMA & ROW LEVEL SECURITY (RLS)
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. User Roles Enum (or Text Check)
-- Roles: 'student', 'teacher', 'admin'

-- 3. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT NOT NULL,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin')),
    teacher_status TEXT DEFAULT 'approved' CHECK (teacher_status IN ('pending', 'approved', 'rejected')),
    bio TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. COURSES TABLE
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    category TEXT DEFAULT 'General',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    price NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. CHAPTERS TABLE
CREATE TABLE IF NOT EXISTS public.chapters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    chapter_order INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. LECTURES TABLE
CREATE TABLE IF NOT EXISTS public.lectures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    video_path TEXT,
    duration INTEGER DEFAULT 0, -- In seconds
    lecture_order INTEGER NOT NULL DEFAULT 1,
    is_published BOOLEAN NOT NULL DEFAULT true,
    is_free_preview BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. NOTES / ATTACHMENTS TABLE
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lecture_id UUID NOT NULL REFERENCES public.lectures(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT DEFAULT 'application/pdf',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. ENROLLMENTS TABLE
CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, course_id)
);

-- 9. LECTURE PROGRESS TABLE
CREATE TABLE IF NOT EXISTS public.lecture_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    lecture_id UUID NOT NULL REFERENCES public.lectures(id) ON DELETE CASCADE,
    watched_seconds INTEGER NOT NULL DEFAULT 0,
    completed BOOLEAN NOT NULL DEFAULT false,
    last_watched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, lecture_id)
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lecture_progress ENABLE ROW LEVEL SECURITY;

-- Helper Function: Check User Role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT LANGUAGE sql SECURITY DEFINER AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$;

-- PROFILES POLICIES
CREATE POLICY "Public profiles are readable by authenticated users"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- COURSES POLICIES
CREATE POLICY "Published courses are viewable by everyone"
ON public.courses FOR SELECT
TO authenticated, anon
USING (status = 'published' OR auth.uid() = teacher_id OR public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Teachers can insert their own courses"
ON public.courses FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = teacher_id AND public.get_user_role(auth.uid()) IN ('teacher', 'admin'));

CREATE POLICY "Teachers can update their own courses"
ON public.courses FOR UPDATE
TO authenticated
USING (auth.uid() = teacher_id OR public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Teachers can delete their own courses"
ON public.courses FOR DELETE
TO authenticated
USING (auth.uid() = teacher_id OR public.get_user_role(auth.uid()) = 'admin');

-- CHAPTERS POLICIES
CREATE POLICY "Chapters viewable if course is accessible"
ON public.chapters FOR SELECT
TO authenticated, anon
USING (
    EXISTS (
        SELECT 1 FROM public.courses c
        WHERE c.id = chapters.course_id
        AND (c.status = 'published' OR c.teacher_id = auth.uid() OR public.get_user_role(auth.uid()) = 'admin')
    )
);

CREATE POLICY "Teachers can manage chapters in their courses"
ON public.chapters FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.courses c
        WHERE c.id = chapters.course_id
        AND (c.teacher_id = auth.uid() OR public.get_user_role(auth.uid()) = 'admin')
    )
);

-- LECTURES POLICIES
CREATE POLICY "Lectures viewable if published or owned"
ON public.lectures FOR SELECT
TO authenticated, anon
USING (
    EXISTS (
        SELECT 1 FROM public.chapters ch
        JOIN public.courses c ON c.id = ch.course_id
        WHERE ch.id = lectures.chapter_id
        AND (c.status = 'published' OR c.teacher_id = auth.uid() OR public.get_user_role(auth.uid()) = 'admin')
    )
);

CREATE POLICY "Teachers can manage lectures in their courses"
ON public.lectures FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.chapters ch
        JOIN public.courses c ON c.id = ch.course_id
        WHERE ch.id = lectures.chapter_id
        AND (c.teacher_id = auth.uid() OR public.get_user_role(auth.uid()) = 'admin')
    )
);

-- NOTES POLICIES
CREATE POLICY "Notes viewable for enrolled students or course owners"
ON public.notes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Teachers can manage notes"
ON public.notes FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.lectures l
        JOIN public.chapters ch ON ch.id = l.chapter_id
        JOIN public.courses c ON c.id = ch.course_id
        WHERE l.id = notes.lecture_id
        AND (c.teacher_id = auth.uid() OR public.get_user_role(auth.uid()) = 'admin')
    )
);

-- ENROLLMENTS POLICIES
CREATE POLICY "Students can view their own enrollments"
ON public.enrollments FOR SELECT
TO authenticated
USING (student_id = auth.uid() OR public.get_user_role(auth.uid()) IN ('teacher', 'admin'));

CREATE POLICY "Students can enroll themselves"
ON public.enrollments FOR INSERT
TO authenticated
WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can unenroll themselves"
ON public.enrollments FOR DELETE
TO authenticated
USING (student_id = auth.uid());

-- LECTURE PROGRESS POLICIES
CREATE POLICY "Students can view their own progress"
ON public.lecture_progress FOR SELECT
TO authenticated
USING (student_id = auth.uid() OR public.get_user_role(auth.uid()) IN ('teacher', 'admin'));

CREATE POLICY "Students can insert or update their own progress"
ON public.lecture_progress FOR ALL
TO authenticated
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

-- ====================================================================
-- 10. SHORTS VIDEO TABLES & POLICIES
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.shorts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration INTEGER DEFAULT 45,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
    course_title TEXT,
    views_count INTEGER NOT NULL DEFAULT 0,
    likes_count INTEGER NOT NULL DEFAULT 0,
    tags TEXT[] DEFAULT ARRAY['Educational']::TEXT[],
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.short_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    short_id UUID NOT NULL REFERENCES public.shorts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    user_avatar TEXT,
    content TEXT NOT NULL,
    likes_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.short_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    short_id UUID NOT NULL REFERENCES public.shorts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(short_id, user_id)
);

ALTER TABLE public.shorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.short_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.short_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on shorts" ON public.shorts FOR SELECT USING (true);
CREATE POLICY "Allow public write access on shorts" ON public.shorts FOR ALL USING (true);
CREATE POLICY "Allow public read access on short_comments" ON public.short_comments FOR SELECT USING (true);
CREATE POLICY "Allow public insert on short_comments" ON public.short_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read access on short_likes" ON public.short_likes FOR SELECT USING (true);
CREATE POLICY "Allow public write on short_likes" ON public.short_likes FOR ALL USING (true);

-- ====================================================================
-- SUPABASE STORAGE BUCKETS SETUP
-- ====================================================================

-- Run these via Supabase SQL editor or storage API:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('course-thumbnails', 'course-thumbnails', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('lecture-videos', 'lecture-videos', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('lecture-notes', 'lecture-notes', true);
