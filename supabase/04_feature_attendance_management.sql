-- ====================================================================
-- FEATURE: ATTENDANCE MANAGEMENT (04_feature_attendance_management.sql)
-- GVM EDULMS — Classes, Subjects, Sessions, Daily Records, Rules & Leaves
-- Run in Supabase SQL Editor: Dashboard -> SQL Editor -> New Query -> Run
-- ====================================================================

-- 1. ATTENDANCE CLASSES TABLE
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
DROP POLICY IF EXISTS "Admin full access attendance_classes" ON public.attendance_classes;
DROP POLICY IF EXISTS "Public read access attendance_classes" ON public.attendance_classes;
DROP POLICY IF EXISTS "Public write access attendance_classes" ON public.attendance_classes;

CREATE POLICY "Public read access attendance_classes" ON public.attendance_classes FOR SELECT USING (true);
CREATE POLICY "Public write access attendance_classes" ON public.attendance_classes FOR ALL USING (true);

-- 2. ATTENDANCE SUBJECTS TABLE
CREATE TABLE IF NOT EXISTS public.attendance_subjects (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  class_id   TEXT NOT NULL REFERENCES public.attendance_classes(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  code       TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.attendance_subjects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read access attendance_subjects" ON public.attendance_subjects;
DROP POLICY IF EXISTS "Public write access attendance_subjects" ON public.attendance_subjects;

CREATE POLICY "Public read access attendance_subjects" ON public.attendance_subjects FOR SELECT USING (true);
CREATE POLICY "Public write access attendance_subjects" ON public.attendance_subjects FOR ALL USING (true);

-- 3. ATTENDANCE CLASS STUDENT ROSTER
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
DROP POLICY IF EXISTS "Public read access attendance_students" ON public.attendance_students;
DROP POLICY IF EXISTS "Public write access attendance_students" ON public.attendance_students;

CREATE POLICY "Public read access attendance_students" ON public.attendance_students FOR SELECT USING (true);
CREATE POLICY "Public write access attendance_students" ON public.attendance_students FOR ALL USING (true);

-- 4. ATTENDANCE SESSIONS TABLE (Daily marked period/lecture)
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
DROP POLICY IF EXISTS "Public read access attendance_sessions" ON public.attendance_sessions;
DROP POLICY IF EXISTS "Public write access attendance_sessions" ON public.attendance_sessions;

CREATE POLICY "Public read access attendance_sessions" ON public.attendance_sessions FOR SELECT USING (true);
CREATE POLICY "Public write access attendance_sessions" ON public.attendance_sessions FOR ALL USING (true);

-- 5. ATTENDANCE RECORDS TABLE (Individual student daily attendance)
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

CREATE INDEX IF NOT EXISTS idx_attendance_records_student ON public.attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_date ON public.attendance_records(date);
CREATE INDEX IF NOT EXISTS idx_attendance_records_class ON public.attendance_records(class_id);

ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read access attendance_records" ON public.attendance_records;
DROP POLICY IF EXISTS "Public write access attendance_records" ON public.attendance_records;

CREATE POLICY "Public read access attendance_records" ON public.attendance_records FOR SELECT USING (true);
CREATE POLICY "Public write access attendance_records" ON public.attendance_records FOR ALL USING (true);

-- 6. ATTENDANCE LEAVE REQUESTS TABLE
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
DROP POLICY IF EXISTS "Public read access leave_requests" ON public.attendance_leave_requests;
DROP POLICY IF EXISTS "Public write access leave_requests" ON public.attendance_leave_requests;

CREATE POLICY "Public read access leave_requests" ON public.attendance_leave_requests FOR SELECT USING (true);
CREATE POLICY "Public write access leave_requests" ON public.attendance_leave_requests FOR ALL USING (true);

-- 7. ATTENDANCE RULES & POLICIES TABLE
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

INSERT INTO public.attendance_rules (id) 
VALUES ('rule_global') 
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.attendance_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read access attendance_rules" ON public.attendance_rules;
DROP POLICY IF EXISTS "Public write access attendance_rules" ON public.attendance_rules;

CREATE POLICY "Public read access attendance_rules" ON public.attendance_rules FOR SELECT USING (true);
CREATE POLICY "Public write access attendance_rules" ON public.attendance_rules FOR ALL USING (true);

-- 8. ATTENDANCE AUDIT LOGS TABLE
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
DROP POLICY IF EXISTS "Public read access attendance_audit_logs" ON public.attendance_audit_logs;
DROP POLICY IF EXISTS "Public write access attendance_audit_logs" ON public.attendance_audit_logs;

CREATE POLICY "Public read access attendance_audit_logs" ON public.attendance_audit_logs FOR SELECT USING (true);
CREATE POLICY "Public write access attendance_audit_logs" ON public.attendance_audit_logs FOR ALL USING (true);
