-- ====================================================================
-- NOTIFICATIONS TABLE & POLICIES FOR EDUCATION LMS
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- NULL means broadcast
    target_audience TEXT NOT NULL DEFAULT 'all' CHECK (target_audience IN ('all', 'students', 'teachers', 'admins', 'user')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'system' CHECK (type IN ('system', 'announcement', 'course', 'enrollment', 'shorts', 'teacher_approval', 'achievement', 'reminder')),
    priority TEXT NOT NULL DEFAULT 'info' CHECK (priority IN ('info', 'success', 'warning', 'error')),
    link_url TEXT,
    link_label TEXT,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    sender_name TEXT,
    sender_avatar TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::JSONB
);

-- User Notification Preferences
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    email_notifications BOOLEAN NOT NULL DEFAULT true,
    push_notifications BOOLEAN NOT NULL DEFAULT true,
    course_announcements BOOLEAN NOT NULL DEFAULT true,
    short_interactions BOOLEAN NOT NULL DEFAULT true,
    system_broadcasts BOOLEAN NOT NULL DEFAULT true,
    sound_enabled BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Indexing for fast retrieval
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_target_audience ON public.notifications(target_audience);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- POLICIES
-- Users can see notifications explicitly sent to them OR broadcasts matching their role
CREATE POLICY "Users can view relevant notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (
    user_id = auth.uid() OR
    target_audience = 'all' OR
    (target_audience = 'students' AND public.get_user_role(auth.uid()) = 'student') OR
    (target_audience = 'teachers' AND public.get_user_role(auth.uid()) = 'teacher') OR
    public.get_user_role(auth.uid()) = 'admin'
);

-- Users can update the is_read status of their own notifications
CREATE POLICY "Users can update their notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (
    user_id = auth.uid() OR
    public.get_user_role(auth.uid()) = 'admin'
);

-- Admins can insert broadcasts and notifications
CREATE POLICY "Admins can insert notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (
    public.get_user_role(auth.uid()) = 'admin' OR
    sender_id = auth.uid()
);

-- Admins can delete notifications
CREATE POLICY "Admins can delete notifications"
ON public.notifications FOR DELETE
TO authenticated
USING (
    public.get_user_role(auth.uid()) = 'admin' OR
    user_id = auth.uid()
);

-- Notification preferences policies
CREATE POLICY "Users manage their own notification preferences"
ON public.notification_preferences FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
