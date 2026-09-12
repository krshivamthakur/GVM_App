export const dynamic = 'force-dynamic'
export const revalidate = 0

import { requireRole } from '@/actions/auth-actions'
import {
  getClassesByTeacher,
  getAttendanceSessions,
  getLeaveRequests,
} from '@/actions/attendance-actions'
import { TeacherAttendancePanel } from '@/components/attendance/TeacherAttendancePanel'

export default async function TeacherAttendancePage() {
  const teacher = await requireRole(['teacher', 'admin'])

  const [classes, sessions, leaveRequests] = await Promise.all([
    getClassesByTeacher(teacher.id),
    getAttendanceSessions(undefined, teacher.id),
    getLeaveRequests('teacher', teacher.id),
  ])

  return (
    <div className="space-y-6 p-1">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">
            Attendance — Teacher Panel
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Mark, manage, and track attendance for your classes and students.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
          <span className="font-semibold text-foreground">{classes.length}</span> classes assigned
        </div>
      </div>

      {classes.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center rounded-2xl border border-dashed border-border bg-card">
          <div className="p-4 rounded-full bg-muted">
            <span className="text-2xl">📋</span>
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">No classes assigned yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Ask your administrator to assign classes to your account.
            </p>
          </div>
        </div>
      ) : (
        <TeacherAttendancePanel
          classes={classes}
          sessions={sessions}
          leaveRequests={leaveRequests}
          teacherId={teacher.id}
          teacherName={teacher.full_name || 'Teacher'}
        />
      )}
    </div>
  )
}
