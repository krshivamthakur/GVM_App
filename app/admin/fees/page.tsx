export const dynamic = 'force-dynamic'
export const revalidate = 0

import { requireRole } from '@/actions/auth-actions'
import {
  getFeeFinancialSummary,
  getStudentFeeProfiles,
  getFeeStructures,
  getFeeCategories,
  getFeePayments,
  getFeeNotificationLogs
} from '@/actions/fee-actions'
import { AdminFeeDashboard } from '@/components/fee/AdminFeeDashboard'

export default async function AdminFeesPage() {
  await requireRole(['admin'])

  const [
    summary,
    profiles,
    structures,
    categories,
    payments,
    notifications
  ] = await Promise.all([
    getFeeFinancialSummary(),
    getStudentFeeProfiles(),
    getFeeStructures(),
    getFeeCategories(),
    getFeePayments(),
    getFeeNotificationLogs()
  ])

  return (
    <div className="space-y-6 p-1">
      <AdminFeeDashboard
        initialSummary={summary}
        initialProfiles={profiles}
        initialStructures={structures}
        initialCategories={categories}
        initialPayments={payments}
        initialNotifications={notifications}
      />
    </div>
  )
}
