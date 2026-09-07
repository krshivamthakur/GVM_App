export const dynamic = 'force-dynamic'
export const revalidate = 0

import { getAllUsers } from '@/actions/admin-actions'
import { 
  getAdminNotificationsAction, 
  getAdminNotificationStatsAction 
} from '@/actions/notification-actions'
import { AdminNotificationManager } from '@/components/notifications/AdminNotificationManager'

export default async function AdminNotificationsPage() {
  const [notifications, stats, users] = await Promise.all([
    getAdminNotificationsAction(),
    getAdminNotificationStatsAction(),
    getAllUsers()
  ])

  return (
    <div className="space-y-6">
      <AdminNotificationManager
        initialNotifications={notifications}
        initialStats={stats}
        allProfiles={users}
      />
    </div>
  )
}
