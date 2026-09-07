export const dynamic = 'force-dynamic'
export const revalidate = 0

import { UserNotificationCenter } from '@/components/notifications/UserNotificationCenter'

export default function StudentNotificationsPage() {
  return (
    <div className="space-y-6">
      <UserNotificationCenter />
    </div>
  )
}
