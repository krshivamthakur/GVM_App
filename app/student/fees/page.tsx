export const dynamic = 'force-dynamic'
export const revalidate = 0

import { getCurrentUser } from '@/actions/auth-actions'
import { redirect } from 'next/navigation'
import {
  getStudentFeeProfile,
  getFeePayments
} from '@/actions/fee-actions'
import { StudentFeeView } from '@/components/fee/StudentFeeView'

export default async function StudentFeesPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.role === 'admin') redirect('/admin/fees')

  const studentId = user.id

  const [profile, payments] = await Promise.all([
    getStudentFeeProfile(studentId),
    getFeePayments({ studentId })
  ])

  if (!profile) {
    return (
      <div className="p-8 text-center text-muted-foreground text-sm">
        No fee profile found for your account. Please contact the administrative bursar.
      </div>
    )
  }

  return (
    <div className="space-y-6 p-1">
      <StudentFeeView
        initialProfile={profile}
        initialPayments={payments}
      />
    </div>
  )
}
