-- ====================================================================
-- FEATURE: SHORTS STUDIO (07_feature_shorts_studio.sql)
-- GVM EDULMS — Byte-sized Educational Video Reels, Likes, Comments, Bookmarks
-- Run in Supabase SQL Editor: Dashboard -> SQL Editor -> New Query -> Run
-- ====================================================================

-- 1. SHORTS TABLE (Vertical Micro-learning Video Clips)
CREATE TABLE IF NOT EXISTS public.shorts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration INTEGER DEFAULT 0, -- Duration in seconds (under 60s)
    teacher_id UUID REFERENCES public."Profile"(id) ON DELETE SET NULL,
    course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
    course_title TEXT,
    views_count INTEGER NOT NULL DEFAULT 0,
    likes_count INTEGER NOT NULL DEFAULT 0,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shorts_teacher_id ON public.shorts(teacher_id);
CREATE INDEX IF NOT EXISTS idx_shorts_course_id ON public.shorts(course_id);
CREATE INDEX IF NOT EXISTS idx_shorts_created_at ON public.shorts(created_at DESC);

ALTER TABLE public.shorts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read on shorts" ON public.shorts;
DROP POLICY IF EXISTS "Public write on shorts" ON public.shorts;
CREATE POLICY "Public read on shorts" ON public.shorts FOR SELECT USING (true);
CREATE POLICY "Public write on shorts" ON public.shorts FOR ALL USING (true);

-- 2. SHORT COMMENTS TABLE (Threaded user reactions on shorts)
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

CREATE INDEX IF NOT EXISTS idx_short_comments_short ON public.short_comments(short_id);

ALTER TABLE public.short_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read on short_comments" ON public.short_comments;
DROP POLICY IF EXISTS "Public write on short_comments" ON public.short_comments;
CREATE POLICY "Public read on short_comments" ON public.short_comments FOR SELECT USING (true);
CREATE POLICY "Public write on short_comments" ON public.short_comments FOR ALL USING (true);

-- 3. SHORT LIKES TABLE (Unique user like tracker)
CREATE TABLE IF NOT EXISTS public.short_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    short_id UUID NOT NULL REFERENCES public.shorts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(short_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_short_likes_user ON public.short_likes(user_id);

ALTER TABLE public.short_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read on short_likes" ON public.short_likes;
DROP POLICY IF EXISTS "Public write on short_likes" ON public.short_likes;
CREATE POLICY "Public read on short_likes" ON public.short_likes FOR SELECT USING (true);
CREATE POLICY "Public write on short_likes" ON public.short_likes FOR ALL USING (true);

-- 4. SHORT BOOKMARKS TABLE (Saved videos for offline/later study)
CREATE TABLE IF NOT EXISTS public.short_bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    short_id UUID NOT NULL REFERENCES public.shorts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(short_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_short_bookmarks_user ON public.short_bookmarks(user_id);

ALTER TABLE public.short_bookmarks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read on short_bookmarks" ON public.short_bookmarks;
DROP POLICY IF EXISTS "Public write on short_bookmarks" ON public.short_bookmarks;
CREATE POLICY "Public read on short_bookmarks" ON public.short_bookmarks FOR SELECT USING (true);
CREATE POLICY "Public write on short_bookmarks" ON public.short_bookmarks FOR ALL USING (true);
