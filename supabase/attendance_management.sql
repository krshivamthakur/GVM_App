-- ATTENDANCE MANAGEMENT SYSTEM SQL MIGRATION
-- Run in Supabase SQL editor for persistent storage.
-- The app falls back to in-memory data if this is not run.

CREATE TABLE IF NOT EXISTS public.attendance_classes (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  course_id    TEXT NOT NULL DEFAULT '',
  course_name  TEXT NOT NULL DEFAULT '',
  teacher_id   TEXT NOT NULL DEFAULT '',
  teacher_name TEXT NOT NULL DEFAULT 'Teacher',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.attendance_classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access attendance_classes" ON public.attendance_classes FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY "Teachers can read their classes" ON public.attendance_classes FOR SELECT
  USING (teacher_id = auth.uid()::text);

CREATE TABLE IF NOT EXISTS public.attendance_subjects (
  id        TEXT PRIMARY KEY,
  class_id  TEXT NOT NULL REFERENCES public.attendance_classes(id) ON DELETE CASCADE,
  name      TEXT NOT NULL,
  code      TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.attendance_subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access attendance_subjects" ON public.attendance_subjects FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY "Teachers can read subjects of their classes" ON public.attendance_subjects FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.attendance_classes ac WHERE ac.id = class_id AND ac.teacher_id = auth.uid()::text));

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
CREATE POLICY "Admin full access attendance_students" ON public.attendance_students FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY "Teachers can manage students of their classes" ON public.attendance_students FOR ALL
  USING (EXISTS (SELECT 1 FROM public.attendance_classes ac WHERE ac.id = class_id AND ac.teacher_id = auth.uid()::text));

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
CREATE POLICY "Admin full access attendance_records" ON public.attendance_records FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY "Teachers can manage records for their classes" ON public.attendance_records FOR ALL
  USING (EXISTS (SELECT 1 FROM public.attendance_classes ac WHERE ac.id = class_id AND ac.teacher_id = auth.uid()::text));
CREATE POLICY "Students can view their own records" ON public.attendance_records FOR SELECT
  USING (student_id = auth.uid()::text);

CREATE TABLE IF NOT EXISTS public.attendance_sessions (
  id              TEXT PRIMARY KEY,
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
CREATE POLICY "Admin full access attendance_sessions" ON public.attendance_sessions FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY "Teachers can manage their own sessions" ON public.attendance_sessions FOR ALL
  USING (teacher_id = auth.uid()::text);

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
CREATE POLICY "Admin full access leave_requests" ON public.attendance_leave_requests FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY "Teachers can review leave in their classes" ON public.attendance_leave_requests FOR ALL
  USING (EXISTS (SELECT 1 FROM public.attendance_classes ac WHERE ac.id = class_id AND ac.teacher_id = auth.uid()::text));
CREATE POLICY "Students can manage their own leave requests" ON public.attendance_leave_requests FOR ALL
  USING (student_id = auth.uid()::text);

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
CREATE POLICY "Admin full access attendance_rules" ON public.attendance_rules FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY "All authenticated can read attendance_rules" ON public.attendance_rules FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS public.attendance_audit_log (
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  record_id         TEXT NOT NULL,
  action            TEXT NOT NULL CHECK (action IN ('created','corrected','deleted','locked')),
  performed_by      TEXT NOT NULL,
  performed_by_name TEXT NOT NULL,
  old_value         TEXT,
  new_value         TEXT,
  timestamp         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes             TEXT
);
ALTER TABLE public.attendance_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access audit_log" ON public.attendance_audit_log FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_att_rec_session    ON public.attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_att_rec_student    ON public.attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_att_rec_class_date ON public.attendance_records(class_id, date);
CREATE INDEX IF NOT EXISTS idx_att_ses_class      ON public.attendance_sessions(class_id);
CREATE INDEX IF NOT EXISTS idx_att_ses_date       ON public.attendance_sessions(date);
CREATE INDEX IF NOT EXISTS idx_att_stu_class      ON public.attendance_students(class_id);
CREATE INDEX IF NOT EXISTS idx_att_lv_student     ON public.attendance_leave_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_att_audit_rec      ON public.attendance_audit_log(record_id);

-- VIEW: Daily attendance summary
CREATE OR REPLACE VIEW public.daily_attendance_summary AS
SELECT
  ar.date, ar.class_id, ac.name AS class_name, ar.subject_id, ar.subject_name,
  COUNT(*) AS total_records,
  COUNT(*) FILTER (WHERE ar.status = 'present') AS present_count,
  COUNT(*) FILTER (WHERE ar.status = 'absent')  AS absent_count,
  COUNT(*) FILTER (WHERE ar.status = 'late')    AS late_count,
  COUNT(*) FILTER (WHERE ar.status = 'leave')   AS leave_count,
  ROUND(COUNT(*) FILTER (WHERE ar.status IN ('present','late')) * 100.0 / NULLIF(COUNT(*),0), 1) AS attendance_percentage
FROM public.attendance_records ar
JOIN public.attendance_classes ac ON ac.id = ar.class_id
GROUP BY ar.date, ar.class_id, ac.name, ar.subject_id, ar.subject_name;

-- FIX: Ensure attendance_rules table has the correct columns
-- (safe to run even if the table already exists with different columns)
ALTER TABLE public.attendance_rules
  ADD COLUMN IF NOT EXISTS min_attendance_percentage   INTEGER NOT NULL DEFAULT 75,
  ADD COLUMN IF NOT EXISTS lock_after_days             INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS allow_correction_by_teacher BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS allow_correction_by_admin   BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS parent_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS low_attendance_threshold    INTEGER NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS auto_mark_leave_on_approval BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS semester_start_date         DATE NOT NULL DEFAULT '2026-06-01',
  ADD COLUMN IF NOT EXISTS semester_end_date           DATE NOT NULL DEFAULT '2026-11-30';

-- VIEW: Per-student attendance summary
-- NOTE: is_low_attendance uses a literal 75 as the threshold.
-- After running this, you can update per your attendance_rules config.
CREATE OR REPLACE VIEW public.student_attendance_summary AS
SELECT
  ar.student_id,
  ar.student_name,
  ar.class_id,
  ac.name                                                          AS class_name,
  COUNT(*)                                                         AS total_classes,
  COUNT(*) FILTER (WHERE ar.status = 'present')                   AS present_count,
  COUNT(*) FILTER (WHERE ar.status = 'absent')                    AS absent_count,
  COUNT(*) FILTER (WHERE ar.status = 'late')                      AS late_count,
  COUNT(*) FILTER (WHERE ar.status = 'leave')                     AS leave_count,
  ROUND(
    COUNT(*) FILTER (WHERE ar.status IN ('present','late')) * 100.0
    / NULLIF(COUNT(*), 0), 1
  )                                                                AS overall_percentage,
  ROUND(
    COUNT(*) FILTER (WHERE ar.status IN ('present','late')) * 100.0
    / NULLIF(COUNT(*), 0), 1
  ) < 75                                                           AS is_low_attendance
FROM public.attendance_records ar
JOIN public.attendance_classes ac ON ac.id = ar.class_id
GROUP BY ar.student_id, ar.student_name, ar.class_id, ac.name;