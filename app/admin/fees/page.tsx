export const dynamic = 'force-dynamic'
export const revalidate = 0

import { requireRole } from '@/actions/auth-actions'
import { getCourses } from '@/actions/course-actions'
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
    notifications,
    courses
  ] = await Promise.all([
    getFeeFinancialSummary(),
    getStudentFeeProfiles(),
    getFeeStructures(),
    getFeeCategories(),
    getFeePayments(),
    getFeeNotificationLogs(),
    getCourses()
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
        initialCourses={courses.map(c => ({
          id: c.id,
          title: c.title,
          category: c.category || undefined,
          price: c.price || undefined
        }))}
      />
    </div>
  )
}
