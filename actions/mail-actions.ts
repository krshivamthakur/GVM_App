'use server'

import { createClient } from '@/lib/supabase/server'
import { sendEmail, createEmailTemplate, renderMergeVariables, SendEmailResponse } from '@/lib/resend'
import { getCurrentUser } from '@/actions/auth-actions'
import { revalidatePath } from 'next/cache'
import {
  MailSettings,
  MailTemplate,
  MailLog,
  DEFAULT_MAIL_SETTINGS,
  DEFAULT_SYSTEM_TEMPLATES,
} from '@/types/mail'

// In-memory cache fallback in case DB table is not yet migrated
let memorySettings: MailSettings = { ...DEFAULT_MAIL_SETTINGS }
let memoryTemplates: MailTemplate[] = [...DEFAULT_SYSTEM_TEMPLATES]
let memoryLogs: MailLog[] = []

/**
 * Fetch Mail Settings
 */
export async function getMailSettingsAction(): Promise<{ success: boolean; settings: MailSettings; fromDb?: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('mail_settings')
      .select('*')
      .eq('id', 'default')
      .maybeSingle()

    if (error || !data) {
      // Table may not exist yet or empty, return default/memory
      return { success: true, settings: memorySettings, fromDb: false }
    }

    const settings: MailSettings = {
      ...DEFAULT_MAIL_SETTINGS,
      ...data,
      auto_triggers: typeof data.auto_triggers === 'object' && data.auto_triggers !== null
        ? { ...DEFAULT_MAIL_SETTINGS.auto_triggers, ...data.auto_triggers }
        : DEFAULT_MAIL_SETTINGS.auto_triggers,
    }
    memorySettings = settings
    return { success: true, settings, fromDb: true }
  } catch (err: any) {
    return { success: true, settings: memorySettings, fromDb: false, error: err?.message }
  }
}

/**
 * Save or Update Mail Settings
 */
export async function updateMailSettingsAction(
  updates: Partial<MailSettings>
): Promise<{ success: boolean; settings?: MailSettings; error?: string }> {
  try {
    const currentUser = await getCurrentUser()
    const merged: MailSettings = {
      ...memorySettings,
      ...updates,
      updated_at: new Date().toISOString(),
    }
    memorySettings = merged

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('mail_settings')
      .upsert({
        id: 'default',
        provider: merged.provider,
        sender_name: merged.sender_name,
        sender_email: merged.sender_email,
        reply_to: merged.reply_to,
        cc_emails: merged.cc_emails,
        bcc_emails: merged.bcc_emails,
        footer_text: merged.footer_text,
        support_phone: merged.support_phone,
        support_email: merged.support_email,
        brand_color: merged.brand_color,
        logo_url: merged.logo_url || '',
        auto_triggers: merged.auto_triggers,
        resend_api_key_override: merged.resend_api_key_override || '',
        updated_at: new Date().toISOString(),
        updated_by: currentUser?.id || null,
      })
      .select()
      .maybeSingle()

    if (error) {
      console.warn('[MailSettings DB Upsert Warning]:', error.message)
    }

    revalidatePath('/admin/mail')
    revalidatePath('/admin/settings')
    return { success: true, settings: merged }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to update mail settings' }
  }
}

/**
 * Fetch Mail Templates
 */
export async function getMailTemplatesAction(): Promise<{ success: boolean; templates: MailTemplate[]; fromDb?: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('mail_templates')
      .select('*')
      .order('created_at', { ascending: false })

    if (error || !data || data.length === 0) {
      return { success: true, templates: memoryTemplates, fromDb: false }
    }

    // Merge any missing default system templates so they are always accessible
    const dbSlugs = new Set(data.map((t: any) => t.slug))
    const missingDefaults = DEFAULT_SYSTEM_TEMPLATES.filter(dt => !dbSlugs.has(dt.slug))
    const allTemplates = [...data, ...missingDefaults]

    memoryTemplates = allTemplates
    return { success: true, templates: allTemplates, fromDb: true }
  } catch (err: any) {
    return { success: true, templates: memoryTemplates, fromDb: false, error: err?.message }
  }
}

/**
 * Create or Update Mail Template
 */
export async function upsertMailTemplateAction(
  templateData: Partial<MailTemplate> & { name: string; subject: string; body_html: string }
): Promise<{ success: boolean; template?: MailTemplate; error?: string }> {
  try {
    const slug = templateData.slug?.trim() || templateData.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 40)
    const existingIndex = memoryTemplates.findIndex(t => t.id === templateData.id || t.slug === slug)

    const templateToSave: MailTemplate = {
      id: templateData.id || (existingIndex >= 0 ? memoryTemplates[existingIndex].id : `custom-${Date.now()}`),
      slug,
      name: templateData.name,
      description: templateData.description || '',
      category: templateData.category || 'custom',
      subject: templateData.subject,
      preview_text: templateData.preview_text || '',
      body_html: templateData.body_html,
      cta_text: templateData.cta_text || '',
      cta_url: templateData.cta_url || '',
      available_variables: templateData.available_variables || ['student_name', 'course_title', 'amount', 'institute_name', 'portal_url'],
      is_active: templateData.is_active ?? true,
      is_system: templateData.is_system ?? false,
      updated_at: new Date().toISOString(),
    }

    if (existingIndex >= 0) {
      memoryTemplates[existingIndex] = templateToSave
    } else {
      memoryTemplates.unshift(templateToSave)
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('mail_templates')
      .upsert({
        id: templateToSave.id.startsWith('custom-') || templateToSave.id.startsWith('sys-') ? undefined : templateToSave.id,
        slug: templateToSave.slug,
        name: templateToSave.name,
        description: templateToSave.description,
        category: templateToSave.category,
        subject: templateToSave.subject,
        preview_text: templateToSave.preview_text,
        body_html: templateToSave.body_html,
        cta_text: templateToSave.cta_text,
        cta_url: templateToSave.cta_url,
        available_variables: templateToSave.available_variables,
        is_active: templateToSave.is_active,
        is_system: templateToSave.is_system,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'slug' })
      .select()
      .maybeSingle()

    if (error) {
      console.warn('[MailTemplates DB Upsert Warning]:', error.message)
    }

    revalidatePath('/admin/mail')
    return { success: true, template: data || templateToSave }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to save email template' }
  }
}

/**
 * Delete a custom email template
 */
export async function deleteMailTemplateAction(
  templateId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const target = memoryTemplates.find(t => t.id === templateId)
    if (target?.is_system) {
      return { success: false, error: 'System default templates cannot be deleted.' }
    }

    memoryTemplates = memoryTemplates.filter(t => t.id !== templateId)

    const supabase = await createClient()
    const { error } = await supabase
      .from('mail_templates')
      .delete()
      .eq('id', templateId)

    if (error) {
      console.warn('[MailTemplates Delete DB Warning]:', error.message)
    }

    revalidatePath('/admin/mail')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to delete template' }
  }
}

/**
 * Log an email delivery attempt to DB & memory
 */
export async function logMailDeliveryAction(log: Omit<MailLog, 'id' | 'sent_at'>): Promise<void> {
  const fullLog: MailLog = {
    ...log,
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    sent_at: new Date().toISOString(),
  }
  memoryLogs.unshift(fullLog)
  if (memoryLogs.length > 200) memoryLogs.pop()

  try {
    const supabase = await createClient()
    await supabase.from('mail_logs').insert({
      recipient_email: log.recipient_email,
      recipient_name: log.recipient_name || '',
      subject: log.subject,
      template_slug: log.template_slug || '',
      template_name: log.template_name || '',
      status: log.status,
      resend_id: log.resend_id || null,
      error_message: log.error_message || null,
      metadata: log.metadata || {},
      sent_at: fullLog.sent_at,
    })
  } catch (err) {
    // Ignore DB log failures
  }
}

/**
 * Send a Test Email or diagnostic verification
 */
export async function sendTestMailAction({
  to,
  templateSlug,
  customSubject,
  customBody,
}: {
  to: string
  templateSlug?: string
  customSubject?: string
  customBody?: string
}): Promise<SendEmailResponse & { previewHtml?: string }> {
  try {
    const { settings } = await getMailSettingsAction()
    const { templates } = await getMailTemplatesAction()

    const template = templateSlug ? templates.find(t => t.slug === templateSlug) : null

    const sampleVariables: Record<string, string | number> = {
      student_name: 'Alex Johnson',
      student_email: to,
      teacher_name: 'Dr. Katherine Reed',
      teacher_email: to,
      recipient_name: 'Valued Member',
      course_title: 'Full-Stack Next.js 16 Masterclass',
      course_category: 'Computer Science & Engineering',
      instructor_name: 'Prof. David Vance',
      amount: 14999,
      receipt_number: 'GVM-2026-08492',
      payment_method: 'Online UPI / Card',
      payment_date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      attendance_percentage: '68.5',
      minimum_required_percentage: '75',
      attended_classes: '22',
      total_classes: '32',
      announcement_title: 'Semester End Examination Schedule Released',
      announcement_summary: 'Comprehensive exam dates and hall ticket instructions are now published.',
      announcement_body: 'All students are requested to download their hall tickets and review the examination guidelines.',
      highlight_note: 'Note: Identity cards are mandatory for entering the exam hall.',
      institute_name: settings.sender_name || 'GVM Educational Institute',
      support_email: settings.support_email || 'support@gvmedu.com',
      portal_url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    }

    const rawSubject = customSubject || template?.subject || 'GVM Mail Diagnostic Test 🚀'
    const rawBody = customBody || template?.body_html || '<p>This is a live diagnostic email sent from the <strong>GVM Mail Setup</strong> panel.</p>'
    const rawPreview = template?.preview_text || 'Test message sent from GVM LMS email engine'
    const rawCtaText = template?.cta_text || 'Open Platform Dashboard'
    const rawCtaUrl = template?.cta_url || (sampleVariables.portal_url as string)

    const finalSubject = renderMergeVariables(rawSubject, sampleVariables)
    const finalBody = renderMergeVariables(rawBody, sampleVariables)
    const finalPreview = renderMergeVariables(rawPreview, sampleVariables)
    const finalCtaUrl = renderMergeVariables(rawCtaUrl, sampleVariables)

    const html = createEmailTemplate({
      title: finalSubject,
      previewText: finalPreview,
      bodyContent: finalBody,
      ctaText: rawCtaText,
      ctaUrl: finalCtaUrl,
      footerText: settings.footer_text,
      instituteName: settings.sender_name,
      brandColor: settings.brand_color,
      logoUrl: settings.logo_url,
    })

    const senderEmail = settings.sender_email.includes('<') 
      ? settings.sender_email 
      : `${settings.sender_name} <${settings.sender_email}>`

    const res = await sendEmail({
      to,
      subject: `[TEST] ${finalSubject}`,
      html,
      from: senderEmail,
      replyTo: settings.reply_to || undefined,
      cc: settings.cc_emails ? settings.cc_emails.split(',').map(s => s.trim()) : undefined,
    })

    await logMailDeliveryAction({
      recipient_email: to,
      recipient_name: sampleVariables.student_name as string,
      subject: `[TEST] ${finalSubject}`,
      template_slug: templateSlug || 'diagnostic_test',
      template_name: template?.name || 'Live Diagnostic Test',
      status: res.success ? 'delivered' : 'failed',
      resend_id: res.id,
      error_message: res.error,
      metadata: { is_test: true, provider: settings.provider },
    })

    return { ...res, previewHtml: html }
  } catch (err: any) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error sending test email'
    await logMailDeliveryAction({
      recipient_email: to,
      subject: '[TEST] Failed Dispatch',
      status: 'failed',
      error_message: errorMsg,
    })
    return { success: false, error: errorMsg }
  }
}

/**
 * Send an email template to a recipient with variable interpolation
 */
export async function sendTemplateEmailAction({
  to,
  recipientName,
  templateSlug,
  variables = {},
  customSubject,
}: {
  to: string | string[]
  recipientName?: string
  templateSlug: string
  variables?: Record<string, string | number | boolean>
  customSubject?: string
}): Promise<SendEmailResponse> {
  try {
    const { settings } = await getMailSettingsAction()
    const { templates } = await getMailTemplatesAction()

    const template = templates.find(t => t.slug === templateSlug)
    if (!template) {
      return { success: false, error: `Email template '${templateSlug}' not found.` }
    }

    if (!template.is_active) {
      return { success: false, error: `Email template '${template.name}' is currently disabled.` }
    }

    const mergedVariables: Record<string, string | number | boolean> = {
      institute_name: settings.sender_name || 'GVM Educational Institute',
      support_email: settings.support_email || 'support@gvmedu.com',
      portal_url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      recipient_name: recipientName || 'Student',
      ...variables,
    }

    const subject = renderMergeVariables(customSubject || template.subject, mergedVariables)
    const bodyContent = renderMergeVariables(template.body_html, mergedVariables)
    const previewText = renderMergeVariables(template.preview_text || '', mergedVariables)
    const ctaUrl = renderMergeVariables(template.cta_url || '', mergedVariables)

    const html = createEmailTemplate({
      title: subject,
      previewText,
      bodyContent,
      ctaText: template.cta_text,
      ctaUrl: ctaUrl || undefined,
      footerText: settings.footer_text,
      instituteName: settings.sender_name,
      brandColor: settings.brand_color,
      logoUrl: settings.logo_url,
    })

    const senderEmail = settings.sender_email.includes('<') 
      ? settings.sender_email 
      : `${settings.sender_name} <${settings.sender_email}>`

    const res = await sendEmail({
      to,
      subject,
      html,
      from: senderEmail,
      replyTo: settings.reply_to || undefined,
      cc: settings.cc_emails ? settings.cc_emails.split(',').map(s => s.trim()) : undefined,
    })

    const recipients = Array.isArray(to) ? to : [to]
    for (const r of recipients) {
      await logMailDeliveryAction({
        recipient_email: r,
        recipient_name: recipientName,
        subject,
        template_slug: template.slug,
        template_name: template.name,
        status: res.success ? 'delivered' : 'failed',
        resend_id: res.id,
        error_message: res.error,
        metadata: { variables: mergedVariables },
      })
    }

    return res
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error executing email dispatch' }
  }
}

/**
 * Fetch Mail Delivery Logs
 */
export async function getMailLogsAction(limit: number = 50): Promise<{ success: boolean; logs: MailLog[] }> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('mail_logs')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(limit)

    if (error || !data || data.length === 0) {
      return { success: true, logs: memoryLogs.slice(0, limit) }
    }

    return { success: true, logs: data }
  } catch (err) {
    return { success: true, logs: memoryLogs.slice(0, limit) }
  }
}
