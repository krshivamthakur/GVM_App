-- ====================================================================
-- GVM EDULMS — COURSE CATEGORIES & PLATFORM SETTINGS SCHEMA
-- Run this script in your Supabase SQL Editor:
-- Supabase Dashboard -> SQL Editor -> New Query -> Paste & Run
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. COURSE CATEGORIES TABLE
-- Stores manageable categories for courses
-- --------------------------------------------------------------------
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

-- Index for fast lookup by name & slug
CREATE INDEX IF NOT EXISTS idx_course_categories_name ON public.course_categories(name);
CREATE INDEX IF NOT EXISTS idx_course_categories_slug ON public.course_categories(slug);

-- Enable Row Level Security
ALTER TABLE public.course_categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public read access on course_categories" ON public.course_categories;
DROP POLICY IF EXISTS "Allow public insert on course_categories" ON public.course_categories;
DROP POLICY IF EXISTS "Allow public update on course_categories" ON public.course_categories;
DROP POLICY IF EXISTS "Allow public delete on course_categories" ON public.course_categories;

-- Policy: Everyone can read categories (Students, Teachers, Admins, Guests)
CREATE POLICY "Allow public read access on course_categories" 
ON public.course_categories FOR SELECT 
USING (true);

-- Policy: Full management access for admins / application backend
CREATE POLICY "Allow public write on course_categories" 
ON public.course_categories FOR ALL 
USING (true);

-- --------------------------------------------------------------------
-- 2. SEED DEFAULT COURSE CATEGORIES
-- Inserts baseline categories without duplicates
-- --------------------------------------------------------------------
INSERT INTO public.course_categories (name, slug, is_default, display_order)
VALUES 
    ('Programming', 'programming', true, 1),
    ('Physics', 'physics', true, 2),
    ('Chemistry', 'chemistry', true, 3),
    ('Mathematics', 'mathematics', true, 4),
    ('Biology', 'biology', true, 5),
    ('General', 'general', true, 6)
ON CONFLICT (name) DO NOTHING;


-- --------------------------------------------------------------------
-- 3. AUTOMATIC COURSE REASSIGNMENT TRIGGERS (DATA INTEGRITY)
-- When a category is renamed or deleted, maintain consistency in courses
-- --------------------------------------------------------------------

-- Function: Reassign courses to 'General' when a category is deleted
CREATE OR REPLACE FUNCTION public.handle_course_category_delete()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.courses
    SET category = 'General',
        updated_at = NOW()
    WHERE category = OLD.name;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_course_category_delete ON public.course_categories;
CREATE TRIGGER trg_course_category_delete
BEFORE DELETE ON public.course_categories
FOR EACH ROW
EXECUTE FUNCTION public.handle_course_category_delete();

-- Function: Update course category names when a category is renamed
CREATE OR REPLACE FUNCTION public.handle_course_category_update()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.name <> NEW.name THEN
        UPDATE public.courses
        SET category = NEW.name,
            updated_at = NOW()
        WHERE category = OLD.name;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_course_category_update ON public.course_categories;
CREATE TRIGGER trg_course_category_update
AFTER UPDATE OF name ON public.course_categories
FOR EACH ROW
EXECUTE FUNCTION public.handle_course_category_update();


-- --------------------------------------------------------------------
-- 4. PLATFORM SETTINGS TABLE (Global Project Branding & Menus)
-- Stores app name, logos, navigation labels, and global preferences
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.platform_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    app_name TEXT NOT NULL DEFAULT 'Gyan Vidya Mandir',
    tagline TEXT DEFAULT 'Excellence in Education & Competitive Prep',
    logo_url TEXT,
    favicon_url TEXT,
    support_email TEXT DEFAULT 'support@gyanvidyamandir.edu',
    support_phone TEXT DEFAULT '+91 98765 43210',
    nav_labels JSONB DEFAULT '{
        "/admin": "Dashboard",
        "/admin/courses": "Courses",
        "/admin/fees": "Fee Management",
        "/admin/attendance": "Attendance",
        "/admin/students": "Students",
        "/admin/teachers": "Teachers",
        "/admin/users": "Users",
        "/admin/shorts": "Shorts Studio",
        "/admin/chat": "Chat & Moderation",
        "/admin/notifications": "Notifications",
        "/admin/reports": "Reports",
        "/admin/settings": "Settings"
    }'::jsonb,
    bottom_bar_labels JSONB DEFAULT '{
        "/student": "Home",
        "/student/courses": "Courses",
        "/student/shorts": "Shorts",
        "/student/chat": "Mentor AI",
        "/student/profile": "Profile"
    }'::jsonb,
    course_categories TEXT[] DEFAULT ARRAY['Programming', 'Physics', 'Chemistry', 'Mathematics', 'Biology', 'General'],
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for platform_settings
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access on platform_settings" ON public.platform_settings;
DROP POLICY IF EXISTS "Allow public write access on platform_settings" ON public.platform_settings;

CREATE POLICY "Allow public read access on platform_settings" 
ON public.platform_settings FOR SELECT 
USING (true);

CREATE POLICY "Allow public write access on platform_settings" 
ON public.platform_settings FOR ALL 
USING (true);

-- Insert initial platform settings row if not exists
INSERT INTO public.platform_settings (id, app_name)
VALUES ('default', 'Gyan Vidya Mandir')
ON CONFLICT (id) DO NOTHING;
