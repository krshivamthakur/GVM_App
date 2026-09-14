-- ====================================================================
-- FEATURE: USER AUTHENTICATION & PROFILES (01_feature_auth_and_profiles.sql)
-- GVM EDULMS — Multi-Role User Profile Schema & Supabase Auth Sync
-- Run in Supabase SQL Editor: Dashboard -> SQL Editor -> New Query -> Run
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. USER PROFILE TABLE (Multi-role: Student, Teacher, Admin)
CREATE TABLE IF NOT EXISTS public."Profile" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT,
    email TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin')),
    teacher_status TEXT DEFAULT 'approved' CHECK (teacher_status IN ('pending', 'approved', 'rejected')),
    bio TEXT DEFAULT '',
    phone TEXT,
    password TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profile_email ON public."Profile"(email);
CREATE INDEX IF NOT EXISTS idx_profile_role ON public."Profile"(role);
CREATE INDEX IF NOT EXISTS idx_profile_teacher_status ON public."Profile"(teacher_status);

-- 3. COMPATIBILITY VIEW for lowercase `profiles` queries
CREATE OR REPLACE VIEW public.profiles AS 
SELECT * FROM public."Profile";

-- 4. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public."Profile" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on Profile" ON public."Profile";
DROP POLICY IF EXISTS "Allow users to read profiles" ON public."Profile";
DROP POLICY IF EXISTS "Allow users to update own profile" ON public."Profile";
DROP POLICY IF EXISTS "Allow full write on Profile" ON public."Profile";

-- Allow read access to profiles for authenticated & public queries
CREATE POLICY "Allow public read on Profile" 
ON public."Profile" FOR SELECT 
USING (true);

-- Allow profile creation and updates
CREATE POLICY "Allow full write on Profile" 
ON public."Profile" FOR ALL 
USING (true);

-- 5. AUTOMATIC PROFILE SYNC TRIGGER WITH SUPABASE AUTH (auth.users)
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public."Profile" (id, email, full_name, role, avatar_url, created_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
        NEW.raw_user_meta_data->>'avatar_url',
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public."Profile".full_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, public."Profile".avatar_url),
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger execution on auth.users registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
