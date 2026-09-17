import { Resend, CreateEmailOptions } from 'resend'

/**
 * Resend client instance initialized with RESEND_API_KEY.
 * If the key is not yet set in environment variables, a warning is logged
 * upon calling send operations rather than throwing at import time.
 */
const apiKey = process.env.RESEND_API_KEY

export const resend = new Resend(apiKey || 're_placeholder_key')

export const DEFAULT_FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || 'GVM <onboarding@resend.dev>'

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  react?: React.ReactNode
  from?: string
  replyTo?: string | string[]
  cc?: string | string[]
  bcc?: string | string[]
  tags?: Array<{ name: string; value: string }>
}

export interface SendEmailResponse {
  success: boolean
  id?: string
  error?: string
}

/**
 * Helper to send transactional emails via Resend SDK
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  react,
  from = DEFAULT_FROM_EMAIL,
  replyTo,
  cc,
  bcc,
  tags,
}: SendEmailOptions): Promise<SendEmailResponse> {
  const currentKey = process.env.RESEND_API_KEY

  if (!currentKey || currentKey.startsWith('re_your_resend_api_key')) {
    const errorMsg =
      'RESEND_API_KEY is not configured in .env.local. Please add your Resend API key to send emails.'
    console.warn(`[Resend SDK Warning] ${errorMsg}`)
    return {
      success: false,
      error: errorMsg,
    }
  }

  try {
    const recipientList = Array.isArray(to) ? to : [to]

    // Resend requires at least one render target (html, text, or react)
    const renderContent = html
      ? { html, ...(text ? { text } : {}) }
      : text
        ? { text }
        : react
          ? { react }
          : { html: '' }

    const payload = {
      from,
      to: recipientList,
      subject,
      ...renderContent,
      ...(replyTo ? { reply_to: replyTo } : {}),
      ...(cc ? { cc } : {}),
      ...(bcc ? { bcc } : {}),
      ...(tags ? { tags } : {}),
    } as CreateEmailOptions

    let finalFrom = from
    let { data, error } = await resend.emails.send(payload)

    // Smart fallback: if custom domain is not yet verified in Resend DNS, auto-retry with onboarding@resend.dev
    if (error && error.message?.toLowerCase().includes('domain is not verified') && !finalFrom.includes('onboarding@resend.dev')) {
      const senderNameMatch = finalFrom.match(/^([^<]+)<.+>$/)
      const friendlyName = senderNameMatch ? senderNameMatch[1].trim() : 'GVM'
      finalFrom = `${friendlyName} <onboarding@resend.dev>`

      const fallbackResult = await resend.emails.send({
        ...payload,
        from: finalFrom,
      })
      data = fallbackResult.data
      error = fallbackResult.error
    }

    if (error) {
      console.error('[Resend SDK Error]:', error)
      let customErrorMsg = error.message

      if (error.message?.includes('You can only send testing emails to your own email address')) {
        customErrorMsg = `${error.message} For instant test verification, please use 'shivamimps1@gmail.com' as recipient.`
      }

      return {
        success: false,
        error: customErrorMsg,
      }
    }

    return {
      success: true,
      id: data?.id,
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error sending email'
    console.error('[Resend SDK Exception]:', err)
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Standard branded HTML email template for GVM App notifications
 */
export function createEmailTemplate({
  title,
  previewText,
  bodyContent,
  ctaText,
  ctaUrl,
  footerText = '© 2026 Gyan Vidya Mandir (GVM). All rights reserved.',
  instituteName = 'Gyan Vidya Mandir',
  instituteSubtitle = 'GVM • Digital Learning & Institution Management',
  brandColor = '#4f46e5',
  logoUrl = '/gvm.png',
}: {
  title: string
  previewText?: string
  bodyContent: string
  ctaText?: string
  ctaUrl?: string
  footerText?: string
  instituteName?: string
  instituteSubtitle?: string
  brandColor?: string
  logoUrl?: string
}): string {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '')
  const resolvedLogoUrl = logoUrl
    ? (logoUrl.startsWith('http://') || logoUrl.startsWith('https://') || logoUrl.startsWith('data:'))
      ? logoUrl
      : `${appUrl}${logoUrl.startsWith('/') ? '' : '/'}${logoUrl}`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#0b0f19;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e2e8f0;">
  ${previewText ? `<div style="display:none;font-size:1px;color:#0b0f19;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${previewText}</div>` : ''}
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#0b0f19;width:100%;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:580px;background-color:#131b2e;border-radius:16px;border:1px solid #1e293b;overflow:hidden;box-shadow:0 10px 25px -5px rgba(0,0,0,0.5);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg, ${brandColor} 0%, #1e1b4b 100%);padding:24px 28px;text-align:left;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width:100%;">
                <tr>
                  ${resolvedLogoUrl ? `
                  <td style="width:48px;vertical-align:middle;padding-right:14px;">
                    <img src="${resolvedLogoUrl}" alt="${instituteName}" style="max-height:44px;max-width:48px;object-fit:contain;display:block;border-radius:8px;background:rgba(255,255,255,0.1);padding:2px;" />
                  </td>
                  ` : ''}
                  <td style="vertical-align:middle;">
                    <h1 style="margin:0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;line-height:1.2;">${instituteName}</h1>
                    <p style="margin:3px 0 0 0;font-size:12px;color:#e0e7ff;font-weight:500;">${instituteSubtitle}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding:32px;">
              <h2 style="margin:0 0 16px 0;font-size:18px;font-weight:600;color:#f8fafc;letter-spacing:-0.01em;">${title}</h2>
              <div style="font-size:14px;line-height:1.65;color:#cbd5e1;margin-bottom:24px;">
                ${bodyContent}
              </div>
              
              ${ctaText && ctaUrl ? `
              <div style="margin:28px 0;text-align:left;">
                <a href="${ctaUrl}" target="_blank" style="background-color:${brandColor};color:#ffffff;padding:12px 26px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;display:inline-block;box-shadow:0 4px 14px rgba(79,70,229,0.35);">
                  ${ctaText} &rarr;
                </a>
              </div>
              ` : ''}

              <hr style="border:none;border-top:1px solid #1e293b;margin:28px 0 20px 0;" />
              
              <p style="margin:0;font-size:12px;color:#64748b;line-height:1.5;">
                ${footerText}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/**
 * Replaces {{variable_name}} tokens in templates with actual values
 */
export function renderMergeVariables(
  text: string,
  variables: Record<string, string | number | boolean | undefined | null>
): string {
  if (!text) return ''
  return text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    const val = variables[key]
    return val !== undefined && val !== null ? String(val) : `{{${key}}}`
  })
}

