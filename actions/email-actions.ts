'use server'

import { sendEmail, createEmailTemplate, SendEmailResponse } from '@/lib/resend'
import { getCurrentUser } from '@/actions/auth-actions'

export interface SendTestEmailParams {
  to: string
  subject?: string
}

/**
 * Server action to test Resend configuration by sending a test email
 */
export async function sendTestEmailAction({
  to,
  subject = 'Resend Test Email - GVM App',
}: SendTestEmailParams): Promise<SendEmailResponse> {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return {
      success: false,
      error: 'Unauthorized: You must be logged in to send a test email.',
    }
  }

  const html = createEmailTemplate({
    title: 'Resend SDK is Working!',
    previewText: 'Your Resend configuration in GVM App is functional.',
    bodyContent: `
      <p>Hello <strong>${currentUser.full_name || 'User'}</strong>,</p>
      <p>This is a test email sent from <strong>GVM App</strong> using the newly installed <strong>Resend Node.js SDK</strong>.</p>
      <div style="background-color:#0f172a;padding:12px 16px;border-radius:8px;border:1px solid #334155;margin:16px 0;font-family:monospace;font-size:13px;color:#a5b4fc;">
        Status: Connection established successfully<br/>
        Recipient: ${to}<br/>
        Sender: GVM App
      </div>
      <p>You can now integrate transactional emails into attendance alerts, course enrollments, and fee receipts.</p>
    `,
    ctaText: 'Visit Dashboard',
    ctaUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  })

  return await sendEmail({
    to,
    subject,
    html,
    text: 'Resend SDK is configured and working in GVM App!',
  })
}

/**
 * Server action to send a general notification email
 */
export async function sendNotificationEmailAction({
  to,
  title,
  message,
  actionUrl,
  actionText,
}: {
  to: string | string[]
  title: string
  message: string
  actionUrl?: string
  actionText?: string
}): Promise<SendEmailResponse> {
  const html = createEmailTemplate({
    title,
    bodyContent: `<p>${message.replace(/\n/g, '<br/>')}</p>`,
    ctaText: actionText,
    ctaUrl: actionUrl,
  })

  return await sendEmail({
    to,
    subject: title,
    html,
    text: message,
  })
}

/**
 * Server action to send fee receipt notification email
 */
export async function sendFeeReceiptEmailAction({
  to,
  studentName,
  receiptNumber,
  amount,
  courseTitle,
  paymentDate,
}: {
  to: string
  studentName: string
  receiptNumber: string
  amount: number
  courseTitle: string
  paymentDate: string
}): Promise<SendEmailResponse> {
  const title = `Payment Receipt: ${receiptNumber}`
  const html = createEmailTemplate({
    title,
    previewText: `Payment confirmation for ${courseTitle}`,
    bodyContent: `
      <p>Dear <strong>${studentName}</strong>,</p>
      <p>Thank you for your payment. Here are the details of your transaction:</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">
        <tr style="border-bottom:1px solid #334155;">
          <td style="padding:8px 0;color:#94a3b8;">Receipt No:</td>
          <td style="padding:8px 0;color:#f8fafc;font-weight:600;text-align:right;">${receiptNumber}</td>
        </tr>
        <tr style="border-bottom:1px solid #334155;">
          <td style="padding:8px 0;color:#94a3b8;">Course:</td>
          <td style="padding:8px 0;color:#f8fafc;font-weight:600;text-align:right;">${courseTitle}</td>
        </tr>
        <tr style="border-bottom:1px solid #334155;">
          <td style="padding:8px 0;color:#94a3b8;">Amount Paid:</td>
          <td style="padding:8px 0;color:#10b981;font-weight:700;font-size:16px;text-align:right;">₹${amount.toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#94a3b8;">Date:</td>
          <td style="padding:8px 0;color:#f8fafc;text-align:right;">${paymentDate}</td>
        </tr>
      </table>
      <p>You can view and download your full receipt anytime from your student portal.</p>
    `,
    ctaText: 'View in Portal',
    ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/student/fees`,
  })

  return await sendEmail({
    to,
    subject: `Fee Payment Receipt - ${receiptNumber}`,
    html,
    text: `Payment Receipt ${receiptNumber}: Received ₹${amount} for ${courseTitle} on ${paymentDate}.`,
  })
}
