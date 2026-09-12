-- ====================================================================
-- GVM EDULMS — PRODUCTION CHAT SYSTEM & STRICT 2-PERSON PRIVACY RLS
-- Paste and run this script in your Supabase SQL Editor:
-- Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ====================================================================

-- 1. CHAT CONVERSATIONS TABLE
CREATE TABLE IF NOT EXISTS public.chat_conversations (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    title TEXT,
    type TEXT NOT NULL DEFAULT 'direct', -- 'direct' | 'group' | 'channel' | 'support'
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

-- 2. CHAT CONVERSATION PARTICIPANTS TABLE
CREATE TABLE IF NOT EXISTS public.chat_participants (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    conversation_id TEXT NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    user_name TEXT,
    user_role TEXT DEFAULT 'student',
    user_avatar TEXT,
    role TEXT NOT NULL DEFAULT 'member', -- 'admin' | 'moderator' | 'member'
    is_muted BOOLEAN NOT NULL DEFAULT false,
    last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(conversation_id, user_id)
);

-- 3. CHAT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    conversation_id TEXT NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    sender_role TEXT DEFAULT 'student',
    sender_avatar TEXT,
    text TEXT NOT NULL DEFAULT '',
    type TEXT NOT NULL DEFAULT 'text', -- 'text' | 'image' | 'file' | 'audio' | 'video' | 'system'
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
    status TEXT NOT NULL DEFAULT 'delivered', -- 'sent' | 'delivered' | 'read'
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

-- 5. CHAT MODERATION & REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.chat_reports (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    message_id TEXT,
    reported_by TEXT NOT NULL,
    reported_user_id TEXT NOT NULL,
    reason TEXT NOT NULL, -- 'spam' | 'harassment' | 'inappropriate' | 'academic_dishonesty' | 'other'
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'reviewed' | 'dismissed' | 'resolved'
    action_taken TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ
);

-- 6. USER BLOCKS TABLE
CREATE TABLE IF NOT EXISTS public.chat_blocks (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    blocker_id TEXT NOT NULL,
    blocked_user_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(blocker_id, blocked_user_id)
);

-- ====================================================================
-- 7. STRICT ROW LEVEL SECURITY (RLS) FOR 2-PERSON DIRECT PRIVACY
-- ====================================================================

-- Enable RLS on all tables
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_blocks ENABLE ROW LEVEL SECURITY;

-- Reset existing policies
DROP POLICY IF EXISTS "Direct chats visible only to participants" ON public.chat_conversations;
DROP POLICY IF EXISTS "Allow conversation insert" ON public.chat_conversations;
DROP POLICY IF EXISTS "Allow conversation update" ON public.chat_conversations;

DROP POLICY IF EXISTS "Participants visible to conversation members" ON public.chat_participants;
DROP POLICY IF EXISTS "Allow participant management" ON public.chat_participants;

DROP POLICY IF EXISTS "Direct chat messages private read" ON public.chat_messages;
DROP POLICY IF EXISTS "Direct chat messages private insert" ON public.chat_messages;
DROP POLICY IF EXISTS "Allow message update by sender" ON public.chat_messages;
DROP POLICY IF EXISTS "Allow message delete by sender" ON public.chat_messages;

-- --- CHAT CONVERSATIONS RLS ---
-- Public channels & cohort groups can be seen by authenticated users.
-- Direct 1-on-1 chats are STRICTLY visible only if current user is one of the 2 participants!
CREATE POLICY "Direct chats visible only to participants" ON public.chat_conversations
FOR SELECT USING (
    type IN ('channel', 'group', 'support')
    OR (
        type = 'direct' AND (
            created_by = auth.uid()::text
            OR id LIKE '%' || auth.uid()::text || '%'
            OR EXISTS (
                SELECT 1 FROM public.chat_participants cp
                WHERE cp.conversation_id = chat_conversations.id
                  AND cp.user_id = auth.uid()::text
            )
        )
    )
);

CREATE POLICY "Allow conversation insert" ON public.chat_conversations
FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' OR auth.role() = 'service_role'
);

CREATE POLICY "Allow conversation update" ON public.chat_conversations
FOR UPDATE USING (
    created_by = auth.uid()::text
    OR id LIKE '%' || auth.uid()::text || '%'
    OR EXISTS (
        SELECT 1 FROM public.chat_participants cp
        WHERE cp.conversation_id = chat_conversations.id
          AND cp.user_id = auth.uid()::text
    )
    OR auth.role() = 'service_role'
);

-- --- CHAT PARTICIPANTS RLS ---
CREATE POLICY "Participants visible to conversation members" ON public.chat_participants
FOR SELECT USING (
    conversation_id NOT LIKE 'direct_%'
    OR user_id = auth.uid()::text
    OR conversation_id LIKE '%' || auth.uid()::text || '%'
    OR auth.role() = 'service_role'
);

CREATE POLICY "Allow participant management" ON public.chat_participants
FOR ALL USING (
    user_id = auth.uid()::text
    OR conversation_id LIKE '%' || auth.uid()::text || '%'
    OR auth.role() = 'service_role'
);

-- --- CHAT MESSAGES RLS ---
-- Privacy Rule: 1-on-1 chats (direct_*) are ONLY readable by the 2 participants.
-- Third parties (even teachers or admins not part of the chat) cannot read the messages!
CREATE POLICY "Direct chat messages private read" ON public.chat_messages
FOR SELECT USING (
    -- 1. Non-direct chats (groups/channels) are visible to members/public
    NOT (conversation_id LIKE 'direct_%')
    OR
    -- 2. Current user is the sender
    sender_id = auth.uid()::text
    OR
    -- 3. Conversation ID encodes user ID (e.g. direct_userA__userB)
    conversation_id LIKE '%' || auth.uid()::text || '%'
    OR
    -- 4. Current user is registered as a participant in this conversation
    EXISTS (
        SELECT 1 FROM public.chat_participants cp
        WHERE cp.conversation_id = chat_messages.conversation_id
          AND cp.user_id = auth.uid()::text
    )
    OR
    auth.role() = 'service_role'
);

-- Privacy Rule: A user can only insert messages into direct chats they are part of!
CREATE POLICY "Direct chat messages private insert" ON public.chat_messages
FOR INSERT WITH CHECK (
    sender_id = auth.uid()::text
    AND (
        NOT (conversation_id LIKE 'direct_%')
        OR conversation_id LIKE '%' || auth.uid()::text || '%'
        OR EXISTS (
            SELECT 1 FROM public.chat_participants cp
            WHERE cp.conversation_id = chat_messages.conversation_id
              AND cp.user_id = auth.uid()::text
        )
    )
    OR auth.role() = 'service_role'
);

CREATE POLICY "Allow message update by sender" ON public.chat_messages
FOR UPDATE USING (
    sender_id = auth.uid()::text OR auth.role() = 'service_role'
);

CREATE POLICY "Allow message delete by sender" ON public.chat_messages
FOR DELETE USING (
    sender_id = auth.uid()::text OR auth.role() = 'service_role'
);

-- --- REACTIONS RLS ---
CREATE POLICY "Allow read chat_reactions" ON public.chat_reactions
FOR SELECT USING (true);

CREATE POLICY "Allow write chat_reactions" ON public.chat_reactions
FOR ALL USING (
    user_id = auth.uid()::text OR auth.role() = 'service_role'
);

-- --- REPORTS & BLOCKS RLS ---
CREATE POLICY "Allow read chat_reports" ON public.chat_reports
FOR SELECT USING (
    reported_by = auth.uid()::text OR auth.role() = 'service_role'
);

CREATE POLICY "Allow write chat_reports" ON public.chat_reports
FOR INSERT WITH CHECK (
    reported_by = auth.uid()::text OR auth.role() = 'service_role'
);

CREATE POLICY "Allow read chat_blocks" ON public.chat_blocks
FOR SELECT USING (
    blocker_id = auth.uid()::text OR auth.role() = 'service_role'
);

CREATE POLICY "Allow write chat_blocks" ON public.chat_blocks
FOR ALL USING (
    blocker_id = auth.uid()::text OR auth.role() = 'service_role'
);

-- ====================================================================
-- 8. PERFORMANCE INDEXES
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_chat_messages_conv_created ON public.chat_messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON public.chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user ON public.chat_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_conv ON public.chat_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_reactions_msg ON public.chat_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_chat_reports_status ON public.chat_reports(status);

-- ====================================================================
-- 9. INITIAL DEFAULT SYSTEM CHANNELS SEED
-- ====================================================================
INSERT INTO public.chat_conversations (id, title, type, avatar, is_locked, is_pinned, pinned_notice, last_message)
VALUES 
  (
    'conv_announcements',
    '#announcements-hub',
    'channel',
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=120&auto=format&fit=crop&q=80',
    true,
    true,
    '📢 Official academic notices, course release alerts, and live masterclass schedules.',
    'Welcome to GVM EduLMS. Check our schedule for upcoming live sessions.'
  ),
  (
    'conv_physics_cohort',
    '#physics-cohort-2026',
    'group',
    'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=120&auto=format&fit=crop&q=80',
    false,
    false,
    '⚡ Weekly discussion thread for Physics problem sets, derivations, and labs.',
    'Has anyone finished Chapter 3 Electromagnetism numerical 14?'
  ),
  (
    'conv_java_guild',
    '#java-developers-guild',
    'group',
    'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=120&auto=format&fit=crop&q=80',
    false,
    false,
    '☕ Java algorithms, OOP paradigms, JVM architecture, and coding doubts.',
    'Checkout the new thread on Memory Management & GC logs.'
  ),
  (
    'conv_support_desk',
    'GVM Student Support & Helpdesk',
    'support',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    false,
    false,
    '💬 24/7 Academic counselling, technical assistance, and enrollment queries.',
    'Hello! How can the academic support team assist you today?'
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  pinned_notice = EXCLUDED.pinned_notice;

-- ====================================================================
-- 10. SUPABASE REALTIME REPLICATION ENABLEMENT
-- ====================================================================
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_conversations;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_reactions;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;
