export const dynamic = 'force-dynamic'
export const revalidate = 0

import { requireRole } from '@/actions/auth-actions'
import { getAllCoursesAdmin } from '@/actions/course-actions'
import {
  getFeeFinancialSummary,
  getStudentFeeProfiles,
  getFeeStructures,
  getFeeCategories,
  getFeePayments,
  getFeeNotificationLogs,
  getFeeDiscounts,
  syncStudentsFromDirectory
} from '@/actions/fee-actions'
import { AdminFeeDashboard } from '@/components/fee/AdminFeeDashboard'

export default async function AdminFeesPage() {
  await requireRole(['admin'])

  // Run directory sync sequentially once to guarantee clean unique state
  await syncStudentsFromDirectory()

  const [
    summary,
    profiles,
    structures,
    categories,
    payments,
    notifications,
    discounts,
    courses
  ] = await Promise.all([
    getFeeFinancialSummary(),
    getStudentFeeProfiles(),
    getFeeStructures(),
    getFeeCategories(),
    getFeePayments(),
    getFeeNotificationLogs(),
    getFeeDiscounts(),
    getAllCoursesAdmin()
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
        initialDiscounts={discounts}
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
