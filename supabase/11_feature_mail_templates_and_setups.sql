-- ====================================================================
-- FEATURE: MAIL TEMPLATES & MAIL SETUPS (11_feature_mail_templates_and_setups.sql)
-- GVM EDULMS — Institutional Email Configuration, Custom Templates & Transmission Logs
-- Run in Supabase SQL Editor: Dashboard -> SQL Editor -> New Query -> Run
-- ====================================================================

-- 1. MAIL SETUPS & CONFIGURATION TABLE
CREATE TABLE IF NOT EXISTS public.mail_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    provider TEXT NOT NULL DEFAULT 'resend' CHECK (provider IN ('resend', 'smtp', 'system')),
    sender_name TEXT NOT NULL DEFAULT 'GVM Educational Institute',
    sender_email TEXT NOT NULL DEFAULT 'onboarding@resend.dev',
    reply_to TEXT DEFAULT 'support@gvmedu.com',
    cc_emails TEXT DEFAULT '',
    bcc_emails TEXT DEFAULT '',
    footer_text TEXT DEFAULT '© 2026 GVM Educational Institute. All rights reserved. 124 Knowledge Boulevard, Institutional Area.',
    support_phone TEXT DEFAULT '+91 98765 43210',
    support_email TEXT DEFAULT 'support@gvmedu.com',
    brand_color TEXT DEFAULT '#4f46e5',
    logo_url TEXT DEFAULT '',
    auto_triggers JSONB NOT NULL DEFAULT '{
        "welcome_student": true,
        "course_enrollment": true,
        "fee_receipt": true,
        "attendance_alert": true,
        "teacher_approval": true,
        "announcement_broadcast": true
    }'::jsonb,
    resend_api_key_override TEXT DEFAULT '',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES public."Profile"(id) ON DELETE SET NULL
);

-- Seed default mail settings if not exists
INSERT INTO public.mail_settings (id)
VALUES ('default')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.mail_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read on mail_settings" ON public.mail_settings;
DROP POLICY IF EXISTS "Public write on mail_settings" ON public.mail_settings;
CREATE POLICY "Public read on mail_settings" ON public.mail_settings FOR SELECT USING (true);
CREATE POLICY "Public write on mail_settings" ON public.mail_settings FOR ALL USING (true);


-- 2. MAIL TEMPLATES TABLE
CREATE TABLE IF NOT EXISTS public.mail_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('onboarding', 'academic', 'finance', 'attendance', 'system', 'custom')),
    subject TEXT NOT NULL,
    preview_text TEXT DEFAULT '',
    body_html TEXT NOT NULL,
    cta_text TEXT DEFAULT '',
    cta_url TEXT DEFAULT '',
    available_variables JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_system BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mail_templates_slug ON public.mail_templates(slug);
CREATE INDEX IF NOT EXISTS idx_mail_templates_category ON public.mail_templates(category);

ALTER TABLE public.mail_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read on mail_templates" ON public.mail_templates;
DROP POLICY IF EXISTS "Public write on mail_templates" ON public.mail_templates;
CREATE POLICY "Public read on mail_templates" ON public.mail_templates FOR SELECT USING (true);
CREATE POLICY "Public write on mail_templates" ON public.mail_templates FOR ALL USING (true);


-- 3. SEED DEFAULT INSTITUTIONAL TEMPLATES
INSERT INTO public.mail_templates (slug, name, description, category, subject, preview_text, body_html, cta_text, cta_url, available_variables, is_active, is_system)
VALUES
(
    'welcome_student',
    'Student Welcome & Onboarding',
    'Dispatched automatically when a new student account is activated.',
    'onboarding',
    'Welcome to {{institute_name}}, {{student_name}}! 🎓',
    'Your student account is now ready. Start learning today.',
    '<p>Dear <strong>{{student_name}}</strong>,</p>
<p>Welcome to <strong>{{institute_name}}</strong>! We are thrilled to have you join our premier digital learning community.</p>
<div style="background-color:#0f172a;padding:16px;border-radius:8px;border:1px solid #334155;margin:16px 0;">
  <p style="margin:0 0 8px 0;color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">Account Credentials</p>
  <p style="margin:0;color:#f8fafc;font-size:14px;"><strong>Registered Email:</strong> {{student_email}}</p>
  <p style="margin:4px 0 0 0;color:#f8fafc;font-size:14px;"><strong>Enrollment Status:</strong> Active Learner</p>
</div>
<p>You can now browse accredited courses, attend live lectures, review daily attendance logs, and download syllabus resources.</p>
<p>If you have any questions, our support desk is always here at {{support_email}}.</p>',
    'Explore Your Student Portal',
    '{{portal_url}}/student',
    '["student_name", "student_email", "institute_name", "support_email", "portal_url"]'::jsonb,
    true,
    true
),
(
    'fee_receipt',
    'Tuition Fee Payment Receipt',
    'Sent immediately when an installment or tuition fee payment is completed.',
    'finance',
    'Fee Receipt [{{receipt_number}}] - {{institute_name}}',
    'Your fee payment of ₹{{amount}} has been successfully processed.',
    '<p>Dear <strong>{{student_name}}</strong>,</p>
<p>Thank you for your payment. Your tuition fee payment has been confirmed and updated in the student financial ledger.</p>
<table style="width:100%;border-collapse:collapse;margin:18px 0;font-size:14px;">
  <tr style="border-bottom:1px solid #334155;">
    <td style="padding:10px 0;color:#94a3b8;">Receipt Reference:</td>
    <td style="padding:10px 0;color:#f8fafc;font-weight:600;text-align:right;">{{receipt_number}}</td>
  </tr>
  <tr style="border-bottom:1px solid #334155;">
    <td style="padding:10px 0;color:#94a3b8;">Course / Department:</td>
    <td style="padding:10px 0;color:#f8fafc;font-weight:600;text-align:right;">{{course_title}}</td>
  </tr>
  <tr style="border-bottom:1px solid #334155;">
    <td style="padding:10px 0;color:#94a3b8;">Amount Paid:</td>
    <td style="padding:10px 0;color:#10b981;font-weight:700;font-size:16px;text-align:right;">₹{{amount}}</td>
  </tr>
  <tr style="border-bottom:1px solid #334155;">
    <td style="padding:10px 0;color:#94a3b8;">Payment Method:</td>
    <td style="padding:10px 0;color:#f8fafc;text-align:right;">{{payment_method}}</td>
  </tr>
  <tr>
    <td style="padding:10px 0;color:#94a3b8;">Transaction Date:</td>
    <td style="padding:10px 0;color:#f8fafc;text-align:right;">{{payment_date}}</td>
  </tr>
</table>
<p>You can print or download the official stamped PDF receipt directly from your student billing dashboard.</p>',
    'Download Official Receipt',
    '{{portal_url}}/student/fees',
    '["student_name", "receipt_number", "course_title", "amount", "payment_method", "payment_date", "portal_url", "institute_name"]'::jsonb,
    true,
    true
),
(
    'course_enrollment',
    'Course Enrollment Confirmation',
    'Notifies the learner when they enroll in a new accredited course.',
    'academic',
    'Enrollment Confirmed: {{course_title}}',
    'You are officially enrolled in {{course_title}}. Begin your lectures now.',
    '<p>Dear <strong>{{student_name}}</strong>,</p>
<p>Congratulations! Your enrollment in <strong>{{course_title}}</strong> has been accepted and approved.</p>
<div style="background-color:#0f172a;padding:16px;border-radius:8px;border:1px solid #334155;margin:16px 0;">
  <p style="margin:0;color:#f8fafc;font-size:14px;"><strong>Instructor:</strong> {{instructor_name}}</p>
  <p style="margin:4px 0 0 0;color:#f8fafc;font-size:14px;"><strong>Course Category:</strong> {{course_category}}</p>
  <p style="margin:4px 0 0 0;color:#f8fafc;font-size:14px;"><strong>Enrolled Date:</strong> {{enrollment_date}}</p>
</div>
<p>Access your video lessons, quizzes, and course curriculum on the learner dashboard anytime.</p>',
    'Start Course Now',
    '{{portal_url}}/student/my-courses',
    '["student_name", "course_title", "instructor_name", "course_category", "enrollment_date", "portal_url"]'::jsonb,
    true,
    true
),
(
    'attendance_warning',
    'Low Attendance Alert',
    'Automated trigger when learner attendance falls below institutional threshold.',
    'attendance',
    'Attendance Alert: Critical Shortage in {{course_title}}',
    'Your current attendance is {{attendance_percentage}}%, below institutional requirements.',
    '<p>Dear <strong>{{student_name}}</strong>,</p>
<p>This is an automated academic advisory from the Department of Academic Affairs at <strong>{{institute_name}}</strong>.</p>
<div style="background-color:#450a0a;border:1px solid #991b1b;padding:16px;border-radius:8px;margin:16px 0;color:#fecaca;">
  <p style="margin:0;font-weight:700;font-size:15px;color:#fca5a5;">Current Attendance: {{attendance_percentage}}%</p>
  <p style="margin:4px 0 0 0;font-size:13px;color:#fecaca;">Minimum Mandatory Institutional Attendance: {{minimum_required_percentage}}%</p>
  <p style="margin:4px 0 0 0;font-size:13px;color:#fecaca;">Total Classes Attended: {{attended_classes}} / {{total_classes}}</p>
</div>
<p>Maintaining required attendance is mandatory for semester examination eligibility. Please consult with your faculty mentor immediately to rectify any discrepancies.</p>',
    'View Attendance Breakdown',
    '{{portal_url}}/student/attendance',
    '["student_name", "course_title", "attendance_percentage", "minimum_required_percentage", "attended_classes", "total_classes", "institute_name", "portal_url"]'::jsonb,
    true,
    true
),
(
    'teacher_approval',
    'Teacher Verification & Approval',
    'Sent when an administrator approves a newly registered teacher account.',
    'onboarding',
    'Faculty Approval Confirmed - Welcome aboard {{teacher_name}}! 🎉',
    'Your faculty profile has been approved by the Administration.',
    '<p>Dear <strong>{{teacher_name}}</strong>,</p>
<p>We are delighted to inform you that your teacher profile has been reviewed and officially verified by the SuperAdmin team at <strong>{{institute_name}}</strong>.</p>
<p>You now possess full instructor privileges on the platform:</p>
<ul style="color:#cbd5e1;line-height:1.8;padding-left:20px;">
  <li>Publish and manage accredited courses and curriculum lectures</li>
  <li>Record daily student attendance registers</li>
  <li>Create high-impact micro lessons in Shorts Studio</li>
  <li>Host faculty-student discussions and office hours</li>
</ul>
<p>Click below to open your Faculty Console and begin creating courses.</p>',
    'Access Teacher Console',
    '{{portal_url}}/teacher',
    '["teacher_name", "teacher_email", "institute_name", "portal_url"]'::jsonb,
    true,
    true
),
(
    'general_announcement',
    'Institutional Broadcast Announcement',
    'Standard template for sending announcements and updates to students, teachers, or all staff.',
    'system',
    'Important Notice: {{announcement_title}}',
    '{{announcement_summary}}',
    '<p>Dear <strong>{{recipient_name}}</strong>,</p>
<p>{{announcement_body}}</p>
<div style="border-left:4px solid #4f46e5;padding-left:14px;margin:16px 0;color:#e2e8f0;font-style:italic;">
  {{highlight_note}}
</div>
<p>For additional details or queries, please reach out to {{support_email}}.</p>',
    'Read Full Announcement',
    '{{portal_url}}',
    '["recipient_name", "announcement_title", "announcement_summary", "announcement_body", "highlight_note", "institute_name", "support_email", "portal_url"]'::jsonb,
    true,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    subject = EXCLUDED.subject,
    preview_text = EXCLUDED.preview_text,
    body_html = EXCLUDED.body_html,
    cta_text = EXCLUDED.cta_text,
    cta_url = EXCLUDED.cta_url,
    available_variables = EXCLUDED.available_variables,
    updated_at = NOW();


-- 4. MAIL TRANSMISSION LOGS TABLE
CREATE TABLE IF NOT EXISTS public.mail_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_email TEXT NOT NULL,
    recipient_name TEXT,
    subject TEXT NOT NULL,
    template_slug TEXT,
    template_name TEXT,
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed', 'mock_sent')),
    resend_id TEXT,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_by UUID REFERENCES public."Profile"(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_mail_logs_recipient ON public.mail_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_mail_logs_sent_at ON public.mail_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_mail_logs_status ON public.mail_logs(status);

ALTER TABLE public.mail_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read on mail_logs" ON public.mail_logs;
DROP POLICY IF EXISTS "Public write on mail_logs" ON public.mail_logs;
CREATE POLICY "Public read on mail_logs" ON public.mail_logs FOR SELECT USING (true);
CREATE POLICY "Public write on mail_logs" ON public.mail_logs FOR ALL USING (true);
