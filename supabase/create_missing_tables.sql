-- ====================================================================
-- GVM EDULMS — MISSING DATABASE TABLES SETUP SCRIPT
-- Run this in your Supabase SQL Editor:
-- Dashboard (https://supabase.com/dashboard/project/ansszvwhfcmdmmtosdgv) -> SQL Editor -> New Query -> Run
-- ====================================================================

-- 1. ENROLLMENTS TABLE (Connects Students to Courses)
CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, course_id)
);

-- Enable RLS and public policies for enrollments
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access on enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Allow public write access on enrollments" ON public.enrollments;
CREATE POLICY "Allow public read access on enrollments" ON public.enrollments FOR SELECT USING (true);
CREATE POLICY "Allow public write access on enrollments" ON public.enrollments FOR ALL USING (true);


-- 2. SHORT COMMENTS TABLE (User comments on Shorts)
CREATE TABLE IF NOT EXISTS public.short_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    short_id UUID NOT NULL REFERENCES public.shorts(id) ON DELETE CASCADE,
    user_id UUID,
    user_name TEXT NOT NULL,
    user_avatar TEXT,
    content TEXT NOT NULL,
    likes_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS and policies for short_comments
ALTER TABLE public.short_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access on short_comments" ON public.short_comments;
DROP POLICY IF EXISTS "Allow public insert on short_comments" ON public.short_comments;
CREATE POLICY "Allow public read access on short_comments" ON public.short_comments FOR SELECT USING (true);
CREATE POLICY "Allow public insert on short_comments" ON public.short_comments FOR INSERT WITH CHECK (true);


-- 3. SHORT LIKES TABLE (Tracks which users liked which short)
CREATE TABLE IF NOT EXISTS public.short_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    short_id UUID NOT NULL REFERENCES public.shorts(id) ON DELETE CASCADE,
    user_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(short_id, user_id)
);

-- Enable RLS and policies for short_likes
ALTER TABLE public.short_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access on short_likes" ON public.short_likes;
DROP POLICY IF EXISTS "Allow public write on short_likes" ON public.short_likes;
CREATE POLICY "Allow public read access on short_likes" ON public.short_likes FOR SELECT USING (true);
CREATE POLICY "Allow public write on short_likes" ON public.short_likes FOR ALL USING (true);


-- 4. NOTIFICATIONS TABLE (System broadcasts, course updates, achievements)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    target_audience TEXT NOT NULL DEFAULT 'all',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'system',
    priority TEXT NOT NULL DEFAULT 'info',
    link_url TEXT,
    link_label TEXT,
    sender_id UUID,
    sender_name TEXT,
    sender_avatar TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::JSONB
);

-- Enable RLS and policies for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access on notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow public write access on notifications" ON public.notifications;
CREATE POLICY "Allow public read access on notifications" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "Allow public write access on notifications" ON public.notifications FOR ALL USING (true);


-- 5. NOTIFICATION PREFERENCES TABLE (Per-user toggle settings)
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    user_id UUID PRIMARY KEY,
    email_notifications BOOLEAN NOT NULL DEFAULT true,
    push_notifications BOOLEAN NOT NULL DEFAULT true,
    course_announcements BOOLEAN NOT NULL DEFAULT true,
    short_interactions BOOLEAN NOT NULL DEFAULT true,
    system_broadcasts BOOLEAN NOT NULL DEFAULT true,
    sound_enabled BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS and policies for notification_preferences
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access on notification_preferences" ON public.notification_preferences;
CREATE POLICY "Allow public access on notification_preferences" ON public.notification_preferences FOR ALL USING (true);


-- 6. SEED INITIAL ENROLLMENT & SAMPLE NOTIFICATION (Optional helper)
INSERT INTO public.enrollments (student_id, course_id)
SELECT '00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111'
WHERE NOT EXISTS (
    SELECT 1 FROM public.enrollments 
    WHERE student_id = '00000000-0000-0000-0000-000000000001' 
    AND course_id = '11111111-1111-1111-1111-111111111111'
);

INSERT INTO public.notifications (target_audience, title, message, type, priority, link_url, link_label)
VALUES 
  ('all', 'Welcome to GVM EduLMS!', 'Explore our courses, interactive shorts, and mentor chat.', 'system', 'info', '/student/courses', 'Browse Courses'),
  ('all', 'Java Masterclass Available', 'Start learning Java from core fundamentals to advanced JVM architecture.', 'course', 'success', '/student/courses', 'View Course')
ON CONFLICT DO NOTHING;
