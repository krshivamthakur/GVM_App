-- ====================================================================
-- FEATURE: CHAT & MESSAGING (06_feature_chat_and_messaging.sql)
-- GVM EDULMS — Realtime Conversations, Direct Chat, Study Groups,
-- Channels, File Attachments, Emoji Reactions, and Moderation
-- Run in Supabase SQL Editor: Dashboard -> SQL Editor -> New Query -> Run
-- ====================================================================

-- 1. CHAT CONVERSATIONS TABLE
CREATE TABLE IF NOT EXISTS public.chat_conversations (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    title TEXT,
    type TEXT NOT NULL DEFAULT 'direct' CHECK (type IN ('direct', 'group', 'channel', 'support')),
    avatar TEXT,
    created_by TEXT,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    is_locked BOOLEAN NOT NULL DEFAULT false,
    pinned_notice TEXT,
    last_message TEXT,
    last_message_time TEXT,
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. CHAT PARTICIPANTS TABLE
CREATE TABLE IF NOT EXISTS public.chat_participants (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    conversation_id TEXT NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    user_name TEXT,
    user_role TEXT DEFAULT 'student',
    user_avatar TEXT,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
    is_muted BOOLEAN NOT NULL DEFAULT false,
    last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_participants_user ON public.chat_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_conv ON public.chat_participants(conversation_id);

-- 3. CHAT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    conversation_id TEXT NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    sender_role TEXT DEFAULT 'student',
    sender_avatar TEXT,
    text TEXT NOT NULL DEFAULT '',
    type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'image', 'file', 'audio', 'video', 'system')),
    media_url TEXT,
    media_name TEXT,
    media_size TEXT,
    media_type TEXT,
    duration_seconds INTEGER,
    reply_to_id TEXT,
    reply_to_text TEXT,
    reply_to_sender TEXT,
    is_edited BOOLEAN NOT NULL DEFAULT false,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL DEFAULT 'delivered' CHECK (status IN ('sending', 'sent', 'delivered', 'read', 'failed')),
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conv_created ON public.chat_messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON public.chat_messages(sender_id);

-- 4. CHAT MESSAGE REACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.chat_reactions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    message_id TEXT NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    user_name TEXT,
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(message_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_chat_reactions_msg ON public.chat_reactions(message_id);

-- 5. CHAT MODERATION & REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.chat_reports (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    message_id TEXT,
    reported_by TEXT NOT NULL,
    reported_user_id TEXT NOT NULL,
    reason TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'inappropriate', 'academic_dishonesty', 'other')),
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'resolved')),
    action_taken TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ
);

-- 6. CHAT USER BLOCKS TABLE
CREATE TABLE IF NOT EXISTS public.chat_blocks (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    blocker_id TEXT NOT NULL,
    blocked_user_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(blocker_id, blocked_user_id)
);

-- 7. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read on chat_conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Public write on chat_conversations" ON public.chat_conversations;
CREATE POLICY "Public read on chat_conversations" ON public.chat_conversations FOR SELECT USING (true);
CREATE POLICY "Public write on chat_conversations" ON public.chat_conversations FOR ALL USING (true);

DROP POLICY IF EXISTS "Public read on chat_participants" ON public.chat_participants;
DROP POLICY IF EXISTS "Public write on chat_participants" ON public.chat_participants;
CREATE POLICY "Public read on chat_participants" ON public.chat_participants FOR SELECT USING (true);
CREATE POLICY "Public write on chat_participants" ON public.chat_participants FOR ALL USING (true);

DROP POLICY IF EXISTS "Public read on chat_messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Public write on chat_messages" ON public.chat_messages;
CREATE POLICY "Public read on chat_messages" ON public.chat_messages FOR SELECT USING (true);
CREATE POLICY "Public write on chat_messages" ON public.chat_messages FOR ALL USING (true);

DROP POLICY IF EXISTS "Public read on chat_reactions" ON public.chat_reactions;
DROP POLICY IF EXISTS "Public write on chat_reactions" ON public.chat_reactions;
CREATE POLICY "Public read on chat_reactions" ON public.chat_reactions FOR SELECT USING (true);
CREATE POLICY "Public write on chat_reactions" ON public.chat_reactions FOR ALL USING (true);

DROP POLICY IF EXISTS "Public read on chat_reports" ON public.chat_reports;
DROP POLICY IF EXISTS "Public write on chat_reports" ON public.chat_reports;
CREATE POLICY "Public read on chat_reports" ON public.chat_reports FOR SELECT USING (true);
CREATE POLICY "Public write on chat_reports" ON public.chat_reports FOR ALL USING (true);

DROP POLICY IF EXISTS "Public read on chat_blocks" ON public.chat_blocks;
DROP POLICY IF EXISTS "Public write on chat_blocks" ON public.chat_blocks;
CREATE POLICY "Public read on chat_blocks" ON public.chat_blocks FOR SELECT USING (true);
CREATE POLICY "Public write on chat_blocks" ON public.chat_blocks FOR ALL USING (true);
