export const dynamic = 'force-dynamic'
export const revalidate = 0

import { getCurrentUser } from '@/actions/auth-actions'
import { redirect } from 'next/navigation'
import {
  getAllClasses,
  getStudentAttendanceSummary,
  getStudentAttendanceHistory,
  getLeaveRequests,
  getAttendanceRules,
} from '@/actions/attendance-actions'
import { StudentAttendanceView } from '@/components/attendance/StudentAttendanceView'

export default async function StudentAttendancePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.role === 'admin') redirect('/admin/attendance')
  if (user.role === 'teacher') redirect('/teacher/attendance')

  const studentId = user.id

  const [summary, history, allClasses, leaveRequests, rule] = await Promise.all([
    getStudentAttendanceSummary(studentId),
    getStudentAttendanceHistory(studentId),
    getAllClasses(),
    getLeaveRequests('student', studentId),
    getAttendanceRules(),
  ])

  return (
    <div className="space-y-6 p-1">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">
            My Attendance
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track your attendance across all subjects and manage leave requests.
          </p>
        </div>
        {summary && (
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold shrink-0 ${
            summary.overallPercentage >= rule.minAttendancePercentage
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-600'
          }`}>
            {summary.overallPercentage}% Overall
          </div>
        )}
      </div>

      <StudentAttendanceView
        summary={summary}
        history={history}
        classes={allClasses}
        leaveRequests={leaveRequests}
        studentId={studentId}
        studentName={user.full_name || 'Student'}
        studentAvatar={user.avatar_url || undefined}
        minAttendancePercentage={rule.minAttendancePercentage}
      />
    </div>
  )
}
