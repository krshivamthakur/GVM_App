import { Metadata } from 'next'
import { AdminChatView } from '@/components/admin/AdminChatView'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Chats Settings | GVM EduLMS Admin',
  description: 'Manage cohort study groups, instructor channels, moderate real-time messages, and broadcast announcements.',
}

import { getChatUsersAction } from '@/actions/chat-actions'

export default async function AdminChatPage() {
  const users = await getChatUsersAction()

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
          Chats Settings
        </h1>
      </div>

      {/* Main Admin Chat & Moderation Suite */}
      <AdminChatView initialUsers={users} />
    </div>
  )
}
