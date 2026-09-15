import React from 'react'
import { Metadata } from 'next'
import {
  getMailSettingsAction,
  getMailTemplatesAction,
  getMailLogsAction,
} from '@/actions/mail-actions'
import { AdminMailManager } from '@/components/admin/mail/AdminMailManager'

export const metadata: Metadata = {
  title: 'Mail Templates & Setups | Admin Console',
  description: 'Manage institutional email templates, configure automated delivery rules, and dispatch broadcasts.',
}

export default async function AdminMailPage() {
  const [settingsRes, templatesRes, logsRes] = await Promise.all([
    getMailSettingsAction(),
    getMailTemplatesAction(),
    getMailLogsAction(100),
  ])

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <AdminMailManager
        initialSettings={settingsRes.settings}
        initialTemplates={templatesRes.templates}
        initialLogs={logsRes.logs}
      />
    </div>
  )
}
