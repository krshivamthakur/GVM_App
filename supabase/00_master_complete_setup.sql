-- ====================================================================
-- GVM EDULMS — COMPLETE 1-CLICK MASTER SUPABASE SETUP (00_master_complete_setup.sql)
-- Sequences all 10 feature schemas and baseline seed data in dependency order.
-- Run in Supabase SQL Editor: Dashboard -> SQL Editor -> New Query -> Run
-- ====================================================================

-- --------------------------------------------------------------------
-- 0. EXTENSIONS
-- --------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- --------------------------------------------------------------------
-- 1. FEATURE: AUTHENTICATION & USER PROFILES
-- --------------------------------------------------------------------
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

CREATE INDEX IF NOT EXISTS idx_profile_email ON public."Profile"(email);
CREATE INDEX IF NOT EXISTS idx_profile_role ON public."Profile"(role);

CREATE OR REPLACE VIEW public.profiles AS SELECT * FROM public."Profile";

ALTER TABLE public."Profile" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read on Profile" ON public."Profile";
DROP POLICY IF EXISTS "Allow full write on Profile" ON public."Profile";
CREATE POLICY "Allow public read on Profile" ON public."Profile" FOR SELECT USING (true);
CREATE POLICY "Allow full write on Profile" ON public."Profile" FOR ALL USING (true);

-- Auth user sync trigger
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- --------------------------------------------------------------------
-- 2. FEATURE: COURSES & CURRICULUM
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

ALTER TABLE public.course_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read on course_categories" ON public.course_categories;
DROP POLICY IF EXISTS "Allow write on course_categories" ON public.course_categories;
CREATE POLICY "Allow read on course_categories" ON public.course_categories FOR SELECT USING (true);
CREATE POLICY "Allow write on course_categories" ON public.course_categories FOR ALL USING (true);

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

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read on courses" ON public.courses;
DROP POLICY IF EXISTS "Allow write on courses" ON public.courses;
CREATE POLICY "Allow read on courses" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Allow write on courses" ON public.courses FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS public.chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    chapter_order INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read on chapters" ON public.chapters;
DROP POLICY IF EXISTS "Allow write on chapters" ON public.chapters;
CREATE POLICY "Allow read on chapters" ON public.chapters FOR SELECT USING (true);
CREATE POLICY "Allow write on chapters" ON public.chapters FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS public.lectures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    video_path TEXT,
    duration INTEGER DEFAULT 0,
    lecture_order INTEGER NOT NULL DEFAULT 1,
    is_published BOOLEAN NOT NULL DEFAULT true,
    is_free_preview BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.lectures ALTER COLUMN title TYPE TEXT;
ALTER TABLE public.lectures ADD COLUMN IF NOT EXISTS is_free_preview BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.lectures ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read on lectures" ON public.lectures;
DROP POLICY IF EXISTS "Allow write on lectures" ON public.lectures;
CREATE POLICY "Allow read on lectures" ON public.lectures FOR SELECT USING (true);
CREATE POLICY "Allow write on lectures" ON public.lectures FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lecture_id UUID NOT NULL REFERENCES public.lectures(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT DEFAULT 'application/pdf',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read on notes" ON public.notes;
DROP POLICY IF EXISTS "Allow write on notes" ON public.notes;
CREATE POLICY "Allow read on notes" ON public.notes FOR SELECT USING (true);
CREATE POLICY "Allow write on notes" ON public.notes FOR ALL USING (true);

-- --------------------------------------------------------------------
-- 3. FEATURE: ENROLLMENTS & LEARNING PROGRESS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public."Profile"(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired', 'revoked')),
    UNIQUE(student_id, course_id)
);

ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read on enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Allow write on enrollments" ON public.enrollments;
CREATE POLICY "Allow read on enrollments" ON public.enrollments FOR SELECT USING (true);
CREATE POLICY "Allow write on enrollments" ON public.enrollments FOR ALL USING (true);

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

ALTER TABLE public.lecture_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read on lecture_progress" ON public.lecture_progress;
DROP POLICY IF EXISTS "Allow write on lecture_progress" ON public.lecture_progress;
CREATE POLICY "Allow read on lecture_progress" ON public.lecture_progress FOR SELECT USING (true);
CREATE POLICY "Allow write on lecture_progress" ON public.lecture_progress FOR ALL USING (true);

-- --------------------------------------------------------------------
-- 4. FEATURE: ATTENDANCE MANAGEMENT
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.attendance_classes (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name         TEXT NOT NULL,
  course_id    TEXT NOT NULL DEFAULT '',
  course_name  TEXT NOT NULL DEFAULT '',
  teacher_id   TEXT NOT NULL DEFAULT '',
  teacher_name TEXT NOT NULL DEFAULT 'Teacher',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.attendance_classes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access attendance_classes" ON public.attendance_classes;
CREATE POLICY "Public access attendance_classes" ON public.attendance_classes FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS public.attendance_subjects (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  class_id   TEXT NOT NULL REFERENCES public.attendance_classes(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  code       TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.attendance_subjects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access attendance_subjects" ON public.attendance_subjects;
CREATE POLICY "Public access attendance_subjects" ON public.attendance_subjects FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS public.attendance_students (
  id           TEXT NOT NULL,
  class_id     TEXT NOT NULL REFERENCES public.attendance_classes(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  avatar_url   TEXT,
  roll_number  TEXT,
  enrolled_at  DATE NOT NULL DEFAULT CURRENT_DATE,
  PRIMARY KEY (id, class_id)
);

ALTER TABLE public.attendance_students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access attendance_students" ON public.attendance_students;
CREATE POLICY "Public access attendance_students" ON public.attendance_students FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS public.attendance_sessions (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  class_id        TEXT NOT NULL REFERENCES public.attendance_classes(id) ON DELETE CASCADE,
  class_name      TEXT NOT NULL,
  subject_id      TEXT NOT NULL,
  subject_name    TEXT NOT NULL,
  date            DATE NOT NULL,
  teacher_id      TEXT NOT NULL,
  teacher_name    TEXT NOT NULL,
  lock_status     TEXT NOT NULL DEFAULT 'open' CHECK (lock_status IN ('open','locked')),
  locked_at       TIMESTAMPTZ,
  submitted_at    TIMESTAMPTZ DEFAULT NOW(),
  total_students  INTEGER NOT NULL DEFAULT 0,
  present_count   INTEGER NOT NULL DEFAULT 0,
  absent_count    INTEGER NOT NULL DEFAULT 0,
  late_count      INTEGER NOT NULL DEFAULT 0,
  leave_count     INTEGER NOT NULL DEFAULT 0,
  UNIQUE (class_id, subject_id, date)
);

ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access attendance_sessions" ON public.attendance_sessions;
CREATE POLICY "Public access attendance_sessions" ON public.attendance_sessions FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS public.attendance_records (
  id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  session_id     TEXT NOT NULL,
  student_id     TEXT NOT NULL,
  student_name   TEXT NOT NULL,
  student_avatar TEXT,
  class_id       TEXT NOT NULL REFERENCES public.attendance_classes(id) ON DELETE CASCADE,
  subject_id     TEXT NOT NULL,
  subject_name   TEXT NOT NULL,
  date           DATE NOT NULL,
  status         TEXT NOT NULL CHECK (status IN ('present','absent','late','leave','half_day','excused')),
  notes          TEXT,
  marked_by      TEXT NOT NULL,
  marked_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  corrected_by   TEXT,
  corrected_at   TIMESTAMPTZ,
  is_excused     BOOLEAN DEFAULT FALSE,
  UNIQUE (session_id, student_id)
);

ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access attendance_records" ON public.attendance_records;
CREATE POLICY "Public access attendance_records" ON public.attendance_records FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS public.attendance_leave_requests (
  id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  student_id     TEXT NOT NULL,
  student_name   TEXT NOT NULL,
  student_avatar TEXT,
  class_id       TEXT NOT NULL REFERENCES public.attendance_classes(id) ON DELETE CASCADE,
  class_name     TEXT NOT NULL,
  from_date      DATE NOT NULL,
  to_date        DATE NOT NULL,
  reason         TEXT NOT NULL,
  document_url   TEXT,
  status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  submitted_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_by    TEXT,
  reviewed_at    TIMESTAMPTZ,
  review_note    TEXT
);

ALTER TABLE public.attendance_leave_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access attendance_leave_requests" ON public.attendance_leave_requests;
CREATE POLICY "Public access attendance_leave_requests" ON public.attendance_leave_requests FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS public.attendance_rules (
  id                            TEXT PRIMARY KEY DEFAULT 'rule_global',
  min_attendance_percentage     INTEGER NOT NULL DEFAULT 75,
  lock_after_days               INTEGER NOT NULL DEFAULT 3,
  allow_correction_by_teacher   BOOLEAN NOT NULL DEFAULT TRUE,
  allow_correction_by_admin     BOOLEAN NOT NULL DEFAULT TRUE,
  parent_notifications_enabled  BOOLEAN NOT NULL DEFAULT TRUE,
  low_attendance_threshold      INTEGER NOT NULL DEFAULT 60,
  auto_mark_leave_on_approval   BOOLEAN NOT NULL DEFAULT TRUE,
  semester_start_date           DATE NOT NULL DEFAULT '2026-06-01',
  semester_end_date             DATE NOT NULL DEFAULT '2026-11-30'
);
INSERT INTO public.attendance_rules (id) VALUES ('rule_global') ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.attendance_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access attendance_rules" ON public.attendance_rules;
CREATE POLICY "Public access attendance_rules" ON public.attendance_rules FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS public.attendance_audit_logs (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  record_id   TEXT,
  session_id  TEXT,
  action      TEXT NOT NULL,
  changed_by  TEXT NOT NULL,
  old_status  TEXT,
  new_status  TEXT,
  reason      TEXT,
  timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.attendance_audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access attendance_audit_logs" ON public.attendance_audit_logs;
CREATE POLICY "Public access attendance_audit_logs" ON public.attendance_audit_logs FOR ALL USING (true);

-- --------------------------------------------------------------------
-- 5. FEATURE: FEE MANAGEMENT
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.fee_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code VARCHAR(20) NOT NULL,
    description TEXT,
    is_refundable BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.fee_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access fee_categories" ON public.fee_categories;
CREATE POLICY "Public access fee_categories" ON public.fee_categories FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS public.fee_structures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    course_id VARCHAR(50) NOT NULL,
    batch_year VARCHAR(20) NOT NULL,
    frequency VARCHAR(20) NOT NULL DEFAULT 'semester' CHECK (frequency IN ('annual', 'semester', 'quarterly', 'monthly', 'one_time')),
    total_amount NUMERIC(12, 2) NOT NULL,
    due_date DATE NOT NULL,
    grace_period_days INTEGER DEFAULT 7,
    late_fine_per_day NUMERIC(10, 2) DEFAULT 50.00,
    max_late_fine NUMERIC(10, 2) DEFAULT 1500.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access fee_structures" ON public.fee_structures;
CREATE POLICY "Public access fee_structures" ON public.fee_structures FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS public.fee_structure_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    structure_id UUID NOT NULL REFERENCES public.fee_structures(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.fee_categories(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    is_optional BOOLEAN DEFAULT false
);

ALTER TABLE public.fee_structure_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access fee_structure_items" ON public.fee_structure_items;
CREATE POLICY "Public access fee_structure_items" ON public.fee_structure_items FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS public.fee_discounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
    value NUMERIC(10, 2) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.fee_discounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access fee_discounts" ON public.fee_discounts;
CREATE POLICY "Public access fee_discounts" ON public.fee_discounts FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS public.student_fee_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL UNIQUE,
    structure_id UUID NOT NULL REFERENCES public.fee_structures(id) ON DELETE CASCADE,
    discount_id UUID REFERENCES public.fee_discounts(id) ON DELETE SET NULL,
    custom_adjustment NUMERIC(12, 2) DEFAULT 0.00,
    net_fee NUMERIC(12, 2) NOT NULL,
    paid_fee NUMERIC(12, 2) DEFAULT 0.00,
    due_fee NUMERIC(12, 2) NOT NULL,
    late_fine_accrued NUMERIC(10, 2) DEFAULT 0.00,
    last_payment_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'unpaid' CHECK (status IN ('paid', 'partial', 'unpaid', 'overdue')),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.student_fee_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access student_fee_profiles" ON public.student_fee_profiles;
CREATE POLICY "Public access student_fee_profiles" ON public.student_fee_profiles FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS public.fee_installments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    installment_number INTEGER NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    due_date DATE NOT NULL,
    paid_amount NUMERIC(12, 2) DEFAULT 0.00,
    late_fine NUMERIC(10, 2) DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'unpaid' CHECK (status IN ('paid', 'partial', 'unpaid', 'overdue')),
    paid_at TIMESTAMPTZ
);

ALTER TABLE public.fee_installments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access fee_installments" ON public.fee_installments;
CREATE POLICY "Public access fee_installments" ON public.fee_installments FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS public.fee_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_number VARCHAR(50) UNIQUE NOT NULL,
    student_id UUID NOT NULL,
    installment_id UUID,
    amount_paid NUMERIC(12, 2) NOT NULL,
    payment_mode VARCHAR(20) NOT NULL CHECK (payment_mode IN ('cash', 'upi', 'bank_transfer', 'card', 'cheque')),
    transaction_ref VARCHAR(100),
    payment_date TIMESTAMPTZ DEFAULT NOW(),
    received_by VARCHAR(100) DEFAULT 'Admin Accounts',
    notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'verified' CHECK (status IN ('verified', 'pending', 'refunded', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.fee_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access fee_payments" ON public.fee_payments;
CREATE POLICY "Public access fee_payments" ON public.fee_payments FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS public.fee_receipt_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    institute_name TEXT NOT NULL DEFAULT 'GVM Educational Institute',
    department_name TEXT DEFAULT 'Department of Student Accounts & Finance',
    reference_prefix TEXT DEFAULT 'GVM-FEE-2026',
    address_line TEXT DEFAULT '124 Knowledge Boulevard, Institutional Area, Tech City - 560001',
    contact_email TEXT DEFAULT 'accounts@gvmedu.com',
    contact_phone TEXT DEFAULT '+91 98765 43210',
    logo_url TEXT,
    authorized_signatory_title TEXT DEFAULT 'Accounts Comptroller / Authorized Registrar',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO public.fee_receipt_settings (id) VALUES ('default') ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.fee_receipt_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access fee_receipt_settings" ON public.fee_receipt_settings;
CREATE POLICY "Public access fee_receipt_settings" ON public.fee_receipt_settings FOR ALL USING (true);

-- --------------------------------------------------------------------
-- 6. FEATURE: CHAT & MESSAGING
-- --------------------------------------------------------------------
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

CREATE TABLE IF NOT EXISTS public.chat_reactions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    message_id TEXT NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    user_name TEXT,
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(message_id, user_id, emoji)
);

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

CREATE TABLE IF NOT EXISTS public.chat_blocks (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    blocker_id TEXT NOT NULL,
    blocked_user_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(blocker_id, blocked_user_id)
);

ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access chat_conversations" ON public.chat_conversations;
CREATE POLICY "Public access chat_conversations" ON public.chat_conversations FOR ALL USING (true);
DROP POLICY IF EXISTS "Public access chat_participants" ON public.chat_participants;
CREATE POLICY "Public access chat_participants" ON public.chat_participants FOR ALL USING (true);
DROP POLICY IF EXISTS "Public access chat_messages" ON public.chat_messages;
CREATE POLICY "Public access chat_messages" ON public.chat_messages FOR ALL USING (true);
DROP POLICY IF EXISTS "Public access chat_reactions" ON public.chat_reactions;
CREATE POLICY "Public access chat_reactions" ON public.chat_reactions FOR ALL USING (true);
DROP POLICY IF EXISTS "Public access chat_reports" ON public.chat_reports;
CREATE POLICY "Public access chat_reports" ON public.chat_reports FOR ALL USING (true);
DROP POLICY IF EXISTS "Public access chat_blocks" ON public.chat_blocks;
CREATE POLICY "Public access chat_blocks" ON public.chat_blocks FOR ALL USING (true);

-- --------------------------------------------------------------------
-- 7. FEATURE: SHORTS STUDIO
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shorts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration INTEGER DEFAULT 0,
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

ALTER TABLE public.shorts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access shorts" ON public.shorts;
CREATE POLICY "Public access shorts" ON public.shorts FOR ALL USING (true);

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

ALTER TABLE public.short_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access short_comments" ON public.short_comments;
CREATE POLICY "Public access short_comments" ON public.short_comments FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS public.short_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    short_id UUID NOT NULL REFERENCES public.shorts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(short_id, user_id)
);

ALTER TABLE public.short_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access short_likes" ON public.short_likes;
CREATE POLICY "Public access short_likes" ON public.short_likes FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS public.short_bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    short_id UUID NOT NULL REFERENCES public.shorts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(short_id, user_id)
);

ALTER TABLE public.short_bookmarks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access short_bookmarks" ON public.short_bookmarks;
CREATE POLICY "Public access short_bookmarks" ON public.short_bookmarks FOR ALL USING (true);

-- --------------------------------------------------------------------
-- 8. FEATURE: NOTIFICATIONS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public."Profile"(id) ON DELETE CASCADE,
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

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access notifications" ON public.notifications;
CREATE POLICY "Public access notifications" ON public.notifications FOR ALL USING (true);

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
DROP POLICY IF EXISTS "Public access notification_preferences" ON public.notification_preferences;
CREATE POLICY "Public access notification_preferences" ON public.notification_preferences FOR ALL USING (true);

-- --------------------------------------------------------------------
-- 9. FEATURE: PLATFORM SETTINGS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.platform_settings (
    id TEXT PRIMARY KEY DEFAULT 'global',
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES public."Profile"(id) ON DELETE SET NULL
);
INSERT INTO public.platform_settings (id) VALUES ('global') ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access platform_settings" ON public.platform_settings;
CREATE POLICY "Public access platform_settings" ON public.platform_settings FOR ALL USING (true);
