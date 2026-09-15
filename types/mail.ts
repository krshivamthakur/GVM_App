export interface MailSettings {
  id: string
  provider: 'resend' | 'smtp' | 'system'
  sender_name: string
  sender_email: string
  reply_to: string
  cc_emails: string
  bcc_emails: string
  footer_text: string
  support_phone: string
  support_email: string
  brand_color: string
  logo_url?: string
  auto_triggers: {
    welcome_student: boolean
    course_enrollment: boolean
    fee_receipt: boolean
    attendance_alert: boolean
    teacher_approval: boolean
    announcement_broadcast: boolean
    [key: string]: boolean
  }
  resend_api_key_override?: string
  updated_at?: string
}

export interface MailTemplate {
  id: string
  slug: string
  name: string
  description?: string
  category: 'onboarding' | 'academic' | 'finance' | 'attendance' | 'system' | 'custom'
  subject: string
  preview_text?: string
  body_html: string
  cta_text?: string
  cta_url?: string
  available_variables: string[]
  is_active: boolean
  is_system: boolean
  created_at?: string
  updated_at?: string
}

export interface MailLog {
  id: string
  recipient_email: string
  recipient_name?: string
  subject: string
  template_slug?: string
  template_name?: string
  status: 'sent' | 'delivered' | 'failed' | 'mock_sent'
  resend_id?: string
  error_message?: string
  metadata?: Record<string, any>
  sent_at: string
}

export const DEFAULT_MAIL_SETTINGS: MailSettings = {
  id: 'default',
  provider: 'resend',
  sender_name: 'GVM Educational Institute',
  sender_email: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
  reply_to: 'support@gvmedu.com',
  cc_emails: '',
  bcc_emails: '',
  footer_text: '© 2026 GVM Educational Institute. All rights reserved. 124 Knowledge Boulevard, Institutional Area.',
  support_phone: '+91 98765 43210',
  support_email: 'support@gvmedu.com',
  brand_color: '#4f46e5',
  logo_url: '',
  auto_triggers: {
    welcome_student: true,
    course_enrollment: true,
    fee_receipt: true,
    attendance_alert: true,
    teacher_approval: true,
    announcement_broadcast: true,
  },
}

export const DEFAULT_SYSTEM_TEMPLATES: MailTemplate[] = [
  {
    id: 'sys-welcome',
    slug: 'welcome_student',
    name: 'Student Welcome & Onboarding',
    description: 'Dispatched automatically when a new student account is activated.',
    category: 'onboarding',
    subject: 'Welcome to {{institute_name}}, {{student_name}}! 🎓',
    preview_text: 'Your student account is now ready. Start learning today.',
    body_html: `<p>Dear <strong>{{student_name}}</strong>,</p>
<p>Welcome to <strong>{{institute_name}}</strong>! We are thrilled to have you join our premier digital learning community.</p>
<div style="background-color:#0f172a;padding:16px;border-radius:8px;border:1px solid #334155;margin:16px 0;">
  <p style="margin:0 0 8px 0;color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">Account Credentials</p>
  <p style="margin:0;color:#f8fafc;font-size:14px;"><strong>Registered Email:</strong> {{student_email}}</p>
  <p style="margin:4px 0 0 0;color:#f8fafc;font-size:14px;"><strong>Enrollment Status:</strong> Active Learner</p>
</div>
<p>You can now browse accredited courses, attend live lectures, review daily attendance logs, and download syllabus resources.</p>
<p>If you have any questions, our support desk is always here at {{support_email}}.</p>`,
    cta_text: 'Explore Your Student Portal',
    cta_url: '{{portal_url}}/student',
    available_variables: ['student_name', 'student_email', 'institute_name', 'support_email', 'portal_url'],
    is_active: true,
    is_system: true,
  },
  {
    id: 'sys-receipt',
    slug: 'fee_receipt',
    name: 'Tuition Fee Payment Receipt',
    description: 'Sent immediately when an installment or tuition fee payment is completed.',
    category: 'finance',
    subject: 'Fee Receipt [{{receipt_number}}] - {{institute_name}}',
    preview_text: 'Your fee payment of ₹{{amount}} has been successfully processed.',
    body_html: `<p>Dear <strong>{{student_name}}</strong>,</p>
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
<p>You can print or download the official stamped PDF receipt directly from your student billing dashboard.</p>`,
    cta_text: 'Download Official Receipt',
    cta_url: '{{portal_url}}/student/fees',
    available_variables: ['student_name', 'receipt_number', 'course_title', 'amount', 'payment_method', 'payment_date', 'portal_url', 'institute_name'],
    is_active: true,
    is_system: true,
  },
  {
    id: 'sys-enrollment',
    slug: 'course_enrollment',
    name: 'Course Enrollment Confirmation',
    description: 'Notifies the learner when they enroll in a new accredited course.',
    category: 'academic',
    subject: 'Enrollment Confirmed: {{course_title}}',
    preview_text: 'You are officially enrolled in {{course_title}}. Begin your lectures now.',
    body_html: `<p>Dear <strong>{{student_name}}</strong>,</p>
<p>Congratulations! Your enrollment in <strong>{{course_title}}</strong> has been accepted and approved.</p>
<div style="background-color:#0f172a;padding:16px;border-radius:8px;border:1px solid #334155;margin:16px 0;">
  <p style="margin:0;color:#f8fafc;font-size:14px;"><strong>Instructor:</strong> {{instructor_name}}</p>
  <p style="margin:4px 0 0 0;color:#f8fafc;font-size:14px;"><strong>Course Category:</strong> {{course_category}}</p>
  <p style="margin:4px 0 0 0;color:#f8fafc;font-size:14px;"><strong>Enrolled Date:</strong> {{enrollment_date}}</p>
</div>
<p>Access your video lessons, quizzes, and course curriculum on the learner dashboard anytime.</p>`,
    cta_text: 'Start Course Now',
    cta_url: '{{portal_url}}/student/my-courses',
    available_variables: ['student_name', 'course_title', 'instructor_name', 'course_category', 'enrollment_date', 'portal_url'],
    is_active: true,
    is_system: true,
  },
  {
    id: 'sys-attendance',
    slug: 'attendance_warning',
    name: 'Low Attendance Alert',
    description: 'Automated trigger when learner attendance falls below institutional threshold.',
    category: 'attendance',
    subject: 'Attendance Alert: Critical Shortage in {{course_title}}',
    preview_text: 'Your current attendance is {{attendance_percentage}}%, below institutional requirements.',
    body_html: `<p>Dear <strong>{{student_name}}</strong>,</p>
<p>This is an automated academic advisory from the Department of Academic Affairs at <strong>{{institute_name}}</strong>.</p>
<div style="background-color:#450a0a;border:1px solid #991b1b;padding:16px;border-radius:8px;margin:16px 0;color:#fecaca;">
  <p style="margin:0;font-weight:700;font-size:15px;color:#fca5a5;">Current Attendance: {{attendance_percentage}}%</p>
  <p style="margin:4px 0 0 0;font-size:13px;color:#fecaca;">Minimum Mandatory Institutional Attendance: {{minimum_required_percentage}}%</p>
  <p style="margin:4px 0 0 0;font-size:13px;color:#fecaca;">Total Classes Attended: {{attended_classes}} / {{total_classes}}</p>
</div>
<p>Maintaining required attendance is mandatory for semester examination eligibility. Please consult with your faculty mentor immediately to rectify any discrepancies.</p>`,
    cta_text: 'View Attendance Breakdown',
    cta_url: '{{portal_url}}/student/attendance',
    available_variables: ['student_name', 'course_title', 'attendance_percentage', 'minimum_required_percentage', 'attended_classes', 'total_classes', 'institute_name', 'portal_url'],
    is_active: true,
    is_system: true,
  },
  {
    id: 'sys-teacher-approval',
    slug: 'teacher_approval',
    name: 'Teacher Verification & Approval',
    description: 'Sent when an administrator approves a newly registered teacher account.',
    category: 'onboarding',
    subject: 'Faculty Approval Confirmed - Welcome aboard {{teacher_name}}! 🎉',
    preview_text: 'Your faculty profile has been approved by the Administration.',
    body_html: `<p>Dear <strong>{{teacher_name}}</strong>,</p>
<p>We are delighted to inform you that your teacher profile has been reviewed and officially verified by the SuperAdmin team at <strong>{{institute_name}}</strong>.</p>
<p>You now possess full instructor privileges on the platform:</p>
<ul style="color:#cbd5e1;line-height:1.8;padding-left:20px;">
  <li>Publish and manage accredited courses and curriculum lectures</li>
  <li>Record daily student attendance registers</li>
  <li>Create high-impact micro lessons in Shorts Studio</li>
  <li>Host faculty-student discussions and office hours</li>
</ul>
<p>Click below to open your Faculty Console and begin creating courses.</p>`,
    cta_text: 'Access Teacher Console',
    cta_url: '{{portal_url}}/teacher',
    available_variables: ['teacher_name', 'teacher_email', 'institute_name', 'portal_url'],
    is_active: true,
    is_system: true,
  },
  {
    id: 'sys-announcement',
    slug: 'general_announcement',
    name: 'Institutional Broadcast Announcement',
    description: 'Standard template for sending announcements and updates to students, teachers, or all staff.',
    category: 'system',
    subject: 'Important Notice: {{announcement_title}}',
    preview_text: '{{announcement_summary}}',
    body_html: `<p>Dear <strong>{{recipient_name}}</strong>,</p>
<p>{{announcement_body}}</p>
<div style="border-left:4px solid #4f46e5;padding-left:14px;margin:16px 0;color:#e2e8f0;font-style:italic;">
  {{highlight_note}}
</div>
<p>For additional details or queries, please reach out to {{support_email}}.</p>`,
    cta_text: 'Read Full Announcement',
    cta_url: '{{portal_url}}',
    available_variables: ['recipient_name', 'announcement_title', 'announcement_summary', 'announcement_body', 'highlight_note', 'institute_name', 'support_email', 'portal_url'],
    is_active: true,
    is_system: true,
  },
]
