import { Metadata } from 'next'
import { AdminChatView } from '@/components/admin/AdminChatView'
import { ShieldCheck, Sparkles } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Community Chat & Moderation | GVM EduLMS Admin',
  description: 'Manage cohort study groups, instructor channels, moderate real-time messages, and broadcast announcements.',
}

import { getChatUsersAction } from '@/actions/chat-actions'

export default async function AdminChatPage() {
  const users = await getChatUsersAction()

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          <span>Real-Time Communication & Governance</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
              Community Chat & Moderation Hub
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              Interact as platform administrator, moderate community channels, control user chat permissions, and dispatch system broadcasts.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Full Moderation Controls</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Admin Chat & Moderation Suite */}
      <AdminChatView initialUsers={users} />
    </div>
  )
}
