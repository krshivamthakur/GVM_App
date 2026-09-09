-- ====================================================================
-- GVM EDULMS — COMPLETE MASTER SUPABASE DATABASE SETUP & MIGRATION
-- Run this script in your Supabase SQL Editor:
-- Supabase Dashboard -> SQL Editor -> New Query -> Paste & Click Run
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ====================================================================
-- 2. TABLE DEFINITIONS
-- ====================================================================

-- 2.1 PROFILES / USERS TABLE
CREATE TABLE IF NOT EXISTS public."Profile" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT,
    email TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin')),
    teacher_status TEXT DEFAULT 'approved' CHECK (teacher_status IN ('pending', 'approved', 'rejected')),
    bio TEXT DEFAULT '',
    password TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Compatibility view for lowercase `profiles` queries
CREATE OR REPLACE VIEW public.profiles AS SELECT * FROM public."Profile";

-- 2.2 COURSES TABLE
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

-- 2.3 CHAPTERS TABLE
CREATE TABLE IF NOT EXISTS public.chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    chapter_order INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.4 LECTURES TABLE
CREATE TABLE IF NOT EXISTS public.lectures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- 2.5 NOTES / ATTACHMENTS TABLE
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lecture_id UUID NOT NULL REFERENCES public.lectures(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT DEFAULT 'application/pdf',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.6 ENROLLMENTS TABLE
CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public."Profile"(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, course_id)
);

-- 2.7 LECTURE PROGRESS TABLE
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

-- 2.8 SHORTS VIDEO TABLE
CREATE TABLE IF NOT EXISTS public.shorts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration INTEGER DEFAULT 45,
    teacher_id UUID REFERENCES public."Profile"(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
    course_title TEXT,
    views_count INTEGER NOT NULL DEFAULT 0,
    likes_count INTEGER NOT NULL DEFAULT 0,
    tags TEXT[] DEFAULT ARRAY['Educational']::TEXT[],
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.9 SHORT COMMENTS TABLE
CREATE TABLE IF NOT EXISTS public.short_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    short_id UUID NOT NULL REFERENCES public.shorts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public."Profile"(id) ON DELETE SET NULL,
    user_name TEXT NOT NULL,
    user_avatar TEXT,
    content TEXT NOT NULL,
    likes_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.10 SHORT LIKES TABLE
CREATE TABLE IF NOT EXISTS public.short_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    short_id UUID NOT NULL REFERENCES public.shorts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public."Profile"(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(short_id, user_id)
);

-- 2.11 NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public."Profile"(id) ON DELETE CASCADE,
    target_audience TEXT NOT NULL DEFAULT 'all', -- 'all', 'students', 'teachers', 'user'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'system',
    priority TEXT NOT NULL DEFAULT 'info',
    link_url TEXT,
    link_label TEXT,
    sender_id UUID REFERENCES public."Profile"(id) ON DELETE SET NULL,
    sender_name TEXT,
    sender_avatar TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::JSONB
);

-- 2.12 NOTIFICATION PREFERENCES TABLE
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES public."Profile"(id) ON DELETE CASCADE,
    email_notifications BOOLEAN NOT NULL DEFAULT true,
    push_notifications BOOLEAN NOT NULL DEFAULT true,
    course_announcements BOOLEAN NOT NULL DEFAULT true,
    short_interactions BOOLEAN NOT NULL DEFAULT true,
    system_broadcasts BOOLEAN NOT NULL DEFAULT true,
    sound_enabled BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public."Profile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lecture_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.short_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.short_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Drop existing public access policies if re-running
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Allow public read access on Profile" ON public."Profile";
    DROP POLICY IF EXISTS "Allow public write access on Profile" ON public."Profile";
    DROP POLICY IF EXISTS "Allow public read access on courses" ON public.courses;
    DROP POLICY IF EXISTS "Allow public write access on courses" ON public.courses;
    DROP POLICY IF EXISTS "Allow public read access on chapters" ON public.chapters;
    DROP POLICY IF EXISTS "Allow public write access on chapters" ON public.chapters;
    DROP POLICY IF EXISTS "Allow public read access on lectures" ON public.lectures;
    DROP POLICY IF EXISTS "Allow public write access on lectures" ON public.lectures;
    DROP POLICY IF EXISTS "Allow public read access on notes" ON public.notes;
    DROP POLICY IF EXISTS "Allow public write access on notes" ON public.notes;
    DROP POLICY IF EXISTS "Allow public read access on enrollments" ON public.enrollments;
    DROP POLICY IF EXISTS "Allow public write access on enrollments" ON public.enrollments;
    DROP POLICY IF EXISTS "Allow public read access on lecture_progress" ON public.lecture_progress;
    DROP POLICY IF EXISTS "Allow public write access on lecture_progress" ON public.lecture_progress;
    DROP POLICY IF EXISTS "Allow public read access on shorts" ON public.shorts;
    DROP POLICY IF EXISTS "Allow public write access on shorts" ON public.shorts;
    DROP POLICY IF EXISTS "Allow public read access on short_comments" ON public.short_comments;
    DROP POLICY IF EXISTS "Allow public write access on short_comments" ON public.short_comments;
    DROP POLICY IF EXISTS "Allow public read access on short_likes" ON public.short_likes;
    DROP POLICY IF EXISTS "Allow public write access on short_likes" ON public.short_likes;
    DROP POLICY IF EXISTS "Allow public read access on notifications" ON public.notifications;
    DROP POLICY IF EXISTS "Allow public write access on notifications" ON public.notifications;
    DROP POLICY IF EXISTS "Allow public access on notification_preferences" ON public.notification_preferences;
END $$;

-- RLS Public & Authenticated Access Policies
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

CREATE POLICY "Allow public read access on enrollments" ON public.enrollments FOR SELECT USING (true);
CREATE POLICY "Allow public write access on enrollments" ON public.enrollments FOR ALL USING (true);

CREATE POLICY "Allow public read access on lecture_progress" ON public.lecture_progress FOR SELECT USING (true);
CREATE POLICY "Allow public write access on lecture_progress" ON public.lecture_progress FOR ALL USING (true);

CREATE POLICY "Allow public read access on shorts" ON public.shorts FOR SELECT USING (true);
CREATE POLICY "Allow public write access on shorts" ON public.shorts FOR ALL USING (true);

CREATE POLICY "Allow public read access on short_comments" ON public.short_comments FOR SELECT USING (true);
CREATE POLICY "Allow public write access on short_comments" ON public.short_comments FOR ALL USING (true);

CREATE POLICY "Allow public read access on short_likes" ON public.short_likes FOR SELECT USING (true);
CREATE POLICY "Allow public write access on short_likes" ON public.short_likes FOR ALL USING (true);

CREATE POLICY "Allow public read access on notifications" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "Allow public write access on notifications" ON public.notifications FOR ALL USING (true);

CREATE POLICY "Allow public access on notification_preferences" ON public.notification_preferences FOR ALL USING (true);

-- ====================================================================
-- 4. STORAGE BUCKETS CONFIGURATION
-- ====================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('course-thumbnails', 'course-thumbnails', true),
    ('lecture-videos', 'lecture-videos', true),
    ('lecture-notes', 'lecture-notes', true),
    ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage RLS Policies
DROP POLICY IF EXISTS "Public Storage Read" ON storage.objects;
DROP POLICY IF EXISTS "Public Storage Insert" ON storage.objects;
DROP POLICY IF EXISTS "Public Storage Update" ON storage.objects;
DROP POLICY IF EXISTS "Public Storage Delete" ON storage.objects;

CREATE POLICY "Public Storage Read" ON storage.objects FOR SELECT USING (true);
CREATE POLICY "Public Storage Insert" ON storage.objects FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Storage Update" ON storage.objects FOR UPDATE USING (true);
CREATE POLICY "Public Storage Delete" ON storage.objects FOR DELETE USING (true);

-- ====================================================================
-- 5. INITIAL SEED DATA
-- ====================================================================

-- 5.1 Profiles (Student, Teacher, Admin)
INSERT INTO public."Profile" (id, full_name, email, role, teacher_status, avatar_url, bio)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'Arjun Verma', 'student@example.com', 'student', 'approved', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80', 'Computer Science student passionate about backend systems.'),
    ('00000000-0000-0000-0000-000000000002', 'Prof. Ramesh Sharma', 'teacher@example.com', 'teacher', 'approved', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', '15+ years experience in Software Engineering and Distributed Systems.'),
    ('00000000-0000-0000-0000-788327949126', 'Admin', 'Admin@example.com', 'admin', 'approved', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', 'Platform Administrator')
ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role;

-- 5.2 Course
INSERT INTO public.courses (id, teacher_id, title, description, thumbnail_url, category, status, price)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000002',
    'Java Programming Complete Masterclass',
    'Master Java from core object-oriented principles to advanced architecture.',
    'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
    'Programming',
    'published',
    0.00
)
ON CONFLICT (id) DO NOTHING;

-- 5.3 Chapter
INSERT INTO public.chapters (id, course_id, title, description, chapter_order)
VALUES (
    'aaaa1111-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    'Chapter 1 — Introduction to Java',
    'Understanding the JVM and JDK setup.',
    1
)
ON CONFLICT (id) DO NOTHING;

-- 5.4 Lecture
INSERT INTO public.lectures (id, chapter_id, title, description, video_path, duration, lecture_order, is_published)
VALUES (
    'bbbb1111-0000-0000-0000-000000000001',
    'aaaa1111-0000-0000-0000-000000000001',
    '01 — JVM Architecture & Memory Model',
    'Deep dive into JVM internals, Stack, Heap, and Garbage Collection.',
    '/videos/sample-short-1.mp4',
    600,
    1,
    true
)
ON CONFLICT (id) DO NOTHING;

-- 5.5 Note
INSERT INTO public.notes (id, lecture_id, title, file_path, file_type)
VALUES (
    'cccc1111-0000-0000-0000-000000000001',
    'bbbb1111-0000-0000-0000-000000000001',
    'Java Architecture & Bytecode Cheatsheet (PDF)',
    'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    'application/pdf'
)
ON CONFLICT (id) DO NOTHING;

-- 5.6 Enrollment
INSERT INTO public.enrollments (student_id, course_id)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111'
)
ON CONFLICT (student_id, course_id) DO NOTHING;

-- 5.7 Notification Preferences
INSERT INTO public.notification_preferences (user_id, email_notifications, push_notifications, course_announcements, short_interactions, system_broadcasts, sound_enabled)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    true, true, true, true, true, true
)
ON CONFLICT (user_id) DO NOTHING;
