'use client'

import React, { useState, useEffect } from 'react'
import type { MailTemplate } from '@/types/mail'
import {
  upsertMailTemplateAction,
  sendTestMailAction,
} from '@/actions/mail-actions'
import {
  X,
  Save,
  Send,
  Eye,
  Smartphone,
  Monitor,
  Sparkles,
  Code2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react'
import { renderMergeVariables } from '@/lib/resend'

interface MailTemplateEditorModalProps {
  template: MailTemplate | null
  isOpen: boolean
  onClose: () => void
  onSaveSuccess: (savedTemplate: MailTemplate) => void
}

const COMMON_TAGS = [
  { tag: '{{student_name}}', desc: 'Recipient Student Name' },
  { tag: '{{student_email}}', desc: 'Recipient Student Email' },
  { tag: '{{course_title}}', desc: 'Accredited Course Title' },
  { tag: '{{amount}}', desc: 'Payment / Fee Amount' },
  { tag: '{{receipt_number}}', desc: 'Fee Receipt Number' },
  { tag: '{{payment_date}}', desc: 'Date of Payment' },
  { tag: '{{attendance_percentage}}', desc: 'Current Attendance %' },
  { tag: '{{minimum_required_percentage}}', desc: 'Mandatory Attendance %' },
  { tag: '{{teacher_name}}', desc: 'Teacher / Instructor Name' },
  { tag: '{{institute_name}}', desc: 'Institute Institutional Name' },
  { tag: '{{support_email}}', desc: 'Support Contact Email' },
  { tag: '{{portal_url}}', desc: 'Application Base URL' },
]

const SAMPLE_DATA: Record<string, string | number> = {
  student_name: 'Alex Johnson',
  student_email: 'alex.j@example.com',
  course_title: 'Full-Stack Next.js 16 Masterclass',
  amount: '14,999',
  receipt_number: 'GVM-2026-08492',
  payment_method: 'Online UPI / Net Banking',
  payment_date: '15 Sep 2026',
  attendance_percentage: '68.5',
  minimum_required_percentage: '75',
  attended_classes: '22',
  total_classes: '32',
  teacher_name: 'Dr. Katherine Reed',
  teacher_email: 'katherine.reed@gvmedu.com',
  recipient_name: 'Valued Member',
  instructor_name: 'Prof. David Vance',
  course_category: 'Computer Science',
  enrollment_date: '15 Sep 2026',
  announcement_title: 'Semester End Examination Schedule Released',
  announcement_summary: 'Comprehensive exam dates and hall ticket instructions are now published.',
  announcement_body: 'All students are requested to download their hall tickets and review the examination guidelines.',
  highlight_note: 'Note: Identity cards are mandatory for entering the exam hall.',
  institute_name: 'GVM Educational Institute',
  support_email: 'support@gvmedu.com',
  portal_url: 'https://gvm.edu.in',
}

export function MailTemplateEditorModal({
  template,
  isOpen,
  onClose,
  onSaveSuccess,
}: MailTemplateEditorModalProps) {
  const isEditing = Boolean(template && template.id)

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [category, setCategory] = useState<MailTemplate['category']>('custom')
  const [subject, setSubject] = useState('')
  const [previewText, setPreviewText] = useState('')
  const [bodyHtml, setBodyHtml] = useState('')
  const [ctaText, setCtaText] = useState('')
  const [ctaUrl, setCtaUrl] = useState('')
  const [isActive, setIsActive] = useState(true)

  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor')
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop')
  const [previewWithSample, setPreviewWithSample] = useState(true)

  const [isSaving, setIsSaving] = useState(false)
  const [isSendingTest, setIsSendingTest] = useState(false)
  const [testEmailInput, setTestEmailInput] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [copiedTag, setCopiedTag] = useState<string | null>(null)

  useEffect(() => {
    if (template) {
      setName(template.name || '')
      setSlug(template.slug || '')
      setCategory(template.category || 'custom')
      setSubject(template.subject || '')
      setPreviewText(template.preview_text || '')
      setBodyHtml(template.body_html || '')
      setCtaText(template.cta_text || '')
      setCtaUrl(template.cta_url || '')
      setIsActive(template.is_active ?? true)
    } else {
      setName('')
      setSlug('')
      setCategory('custom')
      setSubject('Important Update from {{institute_name}}')
      setPreviewText('Please review this message regarding your account.')
      setBodyHtml('<p>Dear <strong>{{student_name}}</strong>,</p>\n<p>We are writing to share an important announcement regarding your courses.</p>\n<p>Best regards,<br/>Academic Team</p>')
      setCtaText('Visit Portal')
      setCtaUrl('{{portal_url}}')
      setIsActive(true)
    }
    setFeedback(null)
  }, [template, isOpen])

  if (!isOpen) return null

  const handleNameChange = (val: string) => {
    setName(val)
    if (!isEditing) {
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 36)
      setSlug(generatedSlug)
    }
  }

  const handleInsertTag = (tag: string, targetField: 'subject' | 'body') => {
    if (targetField === 'subject') {
      setSubject(prev => prev + ' ' + tag)
    } else {
      setBodyHtml(prev => prev + ' ' + tag)
    }
    setCopiedTag(tag)
    setTimeout(() => setCopiedTag(null), 1500)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setFeedback({ type: 'error', message: 'Template Name is required.' })
      return
    }
    if (!subject.trim()) {
      setFeedback({ type: 'error', message: 'Subject line is required.' })
      return
    }
    if (!bodyHtml.trim()) {
      setFeedback({ type: 'error', message: 'Email Body content is required.' })
      return
    }

    setIsSaving(true)
    setFeedback(null)

    try {
      const res = await upsertMailTemplateAction({
        id: template?.id,
        name: name.trim(),
        slug: slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
        category,
        subject: subject.trim(),
        preview_text: previewText.trim(),
        body_html: bodyHtml,
        cta_text: ctaText.trim(),
        cta_url: ctaUrl.trim(),
        is_active: isActive,
        is_system: template?.is_system ?? false,
      })

      if (!res.success || !res.template) {
        setFeedback({ type: 'error', message: res.error || 'Failed to save template.' })
      } else {
        setFeedback({ type: 'success', message: 'Email Template saved successfully!' })
        setTimeout(() => {
          onSaveSuccess(res.template!)
          onClose()
        }, 600)
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Error occurred while saving.' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSendTest = async () => {
    if (!testEmailInput || !testEmailInput.includes('@')) {
      setFeedback({ type: 'error', message: 'Please enter a valid recipient email for the test.' })
      return
    }

    setIsSendingTest(true)
    setFeedback(null)

    try {
      const res = await sendTestMailAction({
        to: testEmailInput.trim(),
        customSubject: subject,
        customBody: bodyHtml,
      })

      if (res.success) {
        setFeedback({ type: 'success', message: `Test email dispatched to ${testEmailInput} via Resend!` })
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to dispatch test email.' })
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Error sending test email.' })
    } finally {
      setIsSendingTest(false)
    }
  }

  // Prepared Preview Values
  const renderedSubject = previewWithSample ? renderMergeVariables(subject, SAMPLE_DATA) : subject
  const renderedPreviewText = previewWithSample ? renderMergeVariables(previewText, SAMPLE_DATA) : previewText
  const renderedBody = previewWithSample ? renderMergeVariables(bodyHtml, SAMPLE_DATA) : bodyHtml
  const renderedCtaUrl = previewWithSample ? renderMergeVariables(ctaUrl, SAMPLE_DATA) : ctaUrl

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 md:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-card border border-border text-foreground rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                {isEditing ? `Edit Template: ${template?.name}` : 'Create Mail Template'}
                {template?.is_system && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                    System Default
                  </span>
                )}
              </h2>
              <p className="text-xs text-muted-foreground">
                Design responsive HTML emails with smart variable tags and instant inbox delivery testing.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher Tabs */}
            <div className="flex items-center p-1 bg-muted/70 border border-border rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('editor')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  activeTab === 'editor'
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Editor</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  activeTab === 'preview'
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Live Preview</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Alert Bar */}
        {feedback && (
          <div
            className={`px-6 py-2.5 flex items-center gap-2 text-xs font-medium ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-b border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-b border-rose-500/20'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'editor' ? (
            <form id="templateForm" onSubmit={handleSave} className="space-y-6">
              {/* Row 1: Name, Slug, Category */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Template Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => handleNameChange(e.target.value)}
                    placeholder="e.g. Student Welcome & Onboarding"
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Unique Slug Identifier
                  </label>
                  <input
                    type="text"
                    value={slug}
                    disabled={template?.is_system}
                    onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="e.g. welcome_student"
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-mono text-primary placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as any)}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="onboarding">Onboarding & Registration</option>
                    <option value="academic">Academic & Curriculum</option>
                    <option value="finance">Finance & Receipts</option>
                    <option value="attendance">Attendance Alerts</option>
                    <option value="system">System & Announcements</option>
                    <option value="custom">Custom Template</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Variable Chips Insert Bar */}
              <div className="bg-muted/40 border border-border rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    Quick Insert Variable Tags (Click to inject):
                  </span>
                  {copiedTag && (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold animate-pulse">
                      Injected {copiedTag}!
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_TAGS.map(item => (
                    <button
                      key={item.tag}
                      type="button"
                      onClick={() => handleInsertTag(item.tag, 'body')}
                      title={item.desc}
                      className="px-2.5 py-1 rounded-lg bg-card hover:bg-primary hover:text-primary-foreground border border-border text-[11px] font-mono text-foreground transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <span>{item.tag}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject Line & Preview Text */}
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Email Subject Line <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleInsertTag('{{student_name}}', 'subject')}
                      className="text-[11px] text-primary hover:underline font-medium cursor-pointer"
                    >
                      + Add {'{{student_name}}'} to subject
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="e.g. Welcome to {{institute_name}}, {{student_name}}!"
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Preheader / Preview Text (Optional preview snippet in inbox)
                  </label>
                  <input
                    type="text"
                    value={previewText}
                    onChange={e => setPreviewText(e.target.value)}
                    placeholder="e.g. Your student account is now ready. Start learning today."
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              {/* Body Content (HTML) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-primary" />
                    Email Body HTML Content <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-muted-foreground">Supports HTML tags & {'{{variables}}'}</span>
                </div>
                <textarea
                  required
                  rows={10}
                  value={bodyHtml}
                  onChange={e => setBodyHtml(e.target.value)}
                  placeholder="<p>Dear {{student_name}},</p>..."
                  className="w-full rounded-xl border border-border bg-background p-3.5 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary leading-relaxed"
                />
              </div>

              {/* CTA Button Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl border border-border bg-muted/30 p-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Call-to-Action (CTA) Button Text
                  </label>
                  <input
                    type="text"
                    value={ctaText}
                    onChange={e => setCtaText(e.target.value)}
                    placeholder="e.g. View Official Receipt"
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Target Button URL
                  </label>
                  <input
                    type="text"
                    value={ctaUrl}
                    onChange={e => setCtaUrl(e.target.value)}
                    placeholder="e.g. {{portal_url}}/student/fees"
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              {/* Status Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card">
                <div>
                  <p className="text-xs font-semibold text-foreground">Template Status</p>
                  <p className="text-[11px] text-muted-foreground">
                    When active, this template can be triggered by automated system events or manual broadcasts.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isActive ? 'bg-primary' : 'bg-muted-foreground/30'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isActive ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </form>
          ) : (
            /* Live Preview Mode */
            <div className="space-y-4">
              {/* Preview Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-muted/40 border border-border rounded-xl">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('desktop')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      previewDevice === 'desktop'
                        ? 'bg-card text-foreground border border-border shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Monitor className="w-4 h-4" />
                    <span>Desktop View</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreviewDevice('mobile')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      previewDevice === 'mobile'
                        ? 'bg-card text-foreground border border-border shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Mobile View</span>
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer font-medium">
                    <input
                      type="checkbox"
                      checked={previewWithSample}
                      onChange={e => setPreviewWithSample(e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <span>Populate Sample Student Data</span>
                  </label>
                </div>
              </div>

              {/* Email Frame Mockup */}
              <div className="flex justify-center bg-muted/20 p-4 rounded-xl border border-border overflow-x-auto">
                <div
                  className={`bg-[#0b0f19] text-[#e2e8f0] rounded-2xl border border-zinc-800 shadow-xl overflow-hidden transition-all duration-300 ${
                    previewDevice === 'mobile' ? 'w-[360px]' : 'w-full max-w-[600px]'
                  }`}
                >
                  {/* Email Client Top Bar */}
                  <div className="bg-zinc-900/90 border-b border-zinc-800 px-4 py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                      <span className="text-zinc-400 ml-2 font-mono text-[11px] truncate max-w-[200px]">
                        Inbox: {renderedSubject}
                      </span>
                    </div>
                  </div>

                  {/* Mail Envelope Meta */}
                  <div className="px-6 py-4 bg-zinc-900/40 border-b border-zinc-800/80 space-y-1 text-xs">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <span className="font-semibold text-zinc-300">From:</span>
                      <span className="text-zinc-200 font-medium">GVM Educational Institute &lt;notifications@gvmedu.com&gt;</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-400">
                      <span className="font-semibold text-zinc-300">To:</span>
                      <span className="text-zinc-200">Alex Johnson &lt;alex.j@example.com&gt;</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-400">
                      <span className="font-semibold text-zinc-300">Subject:</span>
                      <span className="text-white font-semibold">{renderedSubject || '(No subject provided)'}</span>
                    </div>
                    {renderedPreviewText && (
                      <div className="flex items-center gap-2 text-zinc-500 text-[11px]">
                        <span className="font-semibold text-zinc-400">Snippet:</span>
                        <span>{renderedPreviewText}</span>
                      </div>
                    )}
                  </div>

                  {/* Rendered HTML Container */}
                  <div className="p-6">
                    {/* Branded Card Header */}
                    <div className="bg-gradient-to-r from-indigo-600 to-indigo-900 p-5 rounded-t-xl text-white">
                      <h3 className="text-lg font-bold">GVM Educational Institute</h3>
                      <p className="text-xs text-indigo-200">Learning & Institution Management System</p>
                    </div>

                    {/* Card Body */}
                    <div className="bg-[#131b2e] border-x border-b border-zinc-800/80 p-6 rounded-b-xl text-sm leading-relaxed text-zinc-300">
                      <h4 className="text-base font-semibold text-white mb-4">
                        {renderedSubject}
                      </h4>

                      <div
                        className="prose prose-invert prose-sm max-w-none space-y-3"
                        dangerouslySetInnerHTML={{ __html: renderedBody || '<p className="text-zinc-500">No body content defined yet.</p>' }}
                      />

                      {ctaText && (
                        <div className="mt-6 text-left">
                          <a
                            href={renderedCtaUrl || '#'}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all"
                          >
                            <span>{ctaText}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}

                      <div className="mt-8 pt-4 border-t border-zinc-800 text-[11px] text-zinc-500">
                        © 2026 GVM Educational Institute. All rights reserved. 124 Knowledge Boulevard.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-border bg-muted/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Quick Test Email Section */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="email"
              value={testEmailInput}
              onChange={e => setTestEmailInput(e.target.value)}
              placeholder="Send test to your email..."
              className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-52"
            />
            <button
              type="button"
              onClick={handleSendTest}
              disabled={isSendingTest}
              className="px-3 py-1.5 rounded-xl bg-card hover:bg-muted border border-border text-foreground text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3 h-3 text-primary" />
              <span>{isSendingTest ? 'Sending...' : 'Test Send'}</span>
            </button>
          </div>

          {/* Cancel & Save Buttons */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              form="templateForm"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving Template...' : 'Save Template'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
