-- ====================================================================
-- FEATURE: NOTIFICATIONS (08_feature_notifications.sql)
-- GVM EDULMS — In-App Notifications, Announcements & User Preferences
-- Run in Supabase SQL Editor: Dashboard -> SQL Editor -> New Query -> Run
-- ====================================================================

-- 1. NOTIFICATIONS TABLE (Direct & Broadcast Alerts)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public."Profile"(id) ON DELETE CASCADE, -- NULL means broadcast to target_audience
    target_audience TEXT NOT NULL DEFAULT 'all' CHECK (target_audience IN ('all', 'students', 'teachers', 'admins', 'user')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'system' CHECK (type IN ('system', 'announcement', 'course', 'enrollment', 'shorts', 'teacher_approval', 'achievement', 'reminder')),
    priority TEXT NOT NULL DEFAULT 'info' CHECK (priority IN ('info', 'success', 'warning', 'error')),
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

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_target_audience ON public.notifications(target_audience);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read on notifications" ON public.notifications;
DROP POLICY IF EXISTS "Public write on notifications" ON public.notifications;
CREATE POLICY "Public read on notifications" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "Public write on notifications" ON public.notifications FOR ALL USING (true);

-- 2. USER NOTIFICATION PREFERENCES TABLE
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

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read on notification_preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Public write on notification_preferences" ON public.notification_preferences;
CREATE POLICY "Public read on notification_preferences" ON public.notification_preferences FOR SELECT USING (true);
CREATE POLICY "Public write on notification_preferences" ON public.notification_preferences FOR ALL USING (true);
