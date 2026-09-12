export const dynamic = 'force-dynamic'
export const revalidate = 0

import { requireRole } from '@/actions/auth-actions'
import {
  getAllClasses,
  getAttendanceSessions,
  getAllStudentsSummary,
  getAttendanceRules,
  getLeaveRequests,
  getAuditLog,
} from '@/actions/attendance-actions'
import { AdminAttendanceControl } from '@/components/attendance/AdminAttendanceControl'

export default async function AdminAttendancePage() {
  const admin = await requireRole(['admin'])

  const [classes, sessions, allSummaries, rule, leaveRequests, auditLog] = await Promise.all([
    getAllClasses(),
    getAttendanceSessions(),
    getAllStudentsSummary(),
    getAttendanceRules(),
    getLeaveRequests('admin', admin.id),
    getAuditLog(),
  ])

  return (
    <div className="space-y-6 p-1">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">
            Attendance Management
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Monitor, manage, and configure institution-wide attendance records.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 text-[11px] font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Tracking Active
          </div>
        </div>
      </div>

      <AdminAttendanceControl
        allSummaries={allSummaries}
        sessions={sessions}
        classes={classes}
        rule={rule}
        auditLog={auditLog}
        leaveRequests={leaveRequests}
        adminId={admin.id}
        adminName={admin.full_name || 'Administrator'}
      />
    </div>
  )
}
